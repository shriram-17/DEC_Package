import { customAlphabet,nanoid } from "nanoid";

export const CreatePollId =customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSXWYZ',
    6
)

export const createUserId = () => nanoid()
export const createNominatioId = () => nanoid(8)
