class ErrorExplainRequest(BaseModel):
    expected: str
    user_input: str
    question: str = ""

class ErrorExplainResponse(BaseModel):
    explanation_ru: str = ""
    explanation_tt: str = ""


ERROR_EXPLAIN_SYSTEM = (
    "Син — Ак Барс, татар теле укытучысы. Укучы аудировании яки тәрҗемә биремендә хата ясады. "
    "ЭТАЛОН: правильный ответ. ВВЕДЕНО УЧЕНИКОМ: то, что написал ученик. "
    "Объясни по-русски и по-татарски, в чем ошибка ученика (орфография, перепутанные буквы, звуки ә, ө, ү, җ, ң, һ, окончания), "
    "и как правильно написать. "
    "СТРОГИЙ ФОРМАТ JSON без лишнего текста: "
    '{"explanation_ru": "подробное объяснение ошибки на русском и как исправить", "explanation_tt": "кыскача татарча аңлатма"}'
)


@app.post("/api/task/explain-error", response_model=ErrorExplainResponse)
async def explain_error(req: ErrorExplainRequest) -> ErrorExplainResponse:
    if settings.gigachat_auth_key:
        try:
            result = await gigachat.chat(
                messages=[
                    {"role": "system", "content": ERROR_EXPLAIN_SYSTEM},
                    {"role": "user", "content": f"ВОПРОС: {req.question}\nЭТАЛОН: {req.expected}\ْنВВЕДЕНО: {req.user_input}"},
                ],
                temperature=0.3,
                max_tokens=300,
            )
            import json
            start, end = result.find("{"), result.rfind("}")
            data = json.loads(result[start : end + 1])
            return ErrorExplainResponse(
                explanation_ru=str(data.get("explanation_ru", "Проверьте орфографию и специфические татарские буквы.")),
                explanation_tt=str(data.get("explanation_tt", "Хәрефләргә һәм грамматикага игътибар ит."))
            )
        except Exception:
            pass

    return ErrorExplainResponse(
        explanation_ru=f"Вы написали «{req.user_input}», а правильный ответ — «{req.expected}». Обратите внимание на написание и татарские буквы (ә, ө, ү, җ, ң, һ).",
        explanation_tt=f"Дөрес җавап: «{req.expected}». Игътибарлырак бул!"
    )
