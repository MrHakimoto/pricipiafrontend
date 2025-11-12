"use client"

import { api } from "@/lib/api";
import { Box, Button, TextField, Typography, Link as MuiLink, Alert } from "@mui/material";
import Link from "next/link";
import { FormEvent, useState } from "react";

const Page = () => {
    const [error, setError] = useState('')
    const [loading, SetLoading] = useState(false);
    const [passwordField, setpasswordField] = useState('');
    const [passwordField2, setpasswordField2] = useState('');

    const [info, setInfo] = useState('')

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!passwordField || !passwordField2) {
            setError('Preencha os campos!')
            return
        }
        else if (passwordField !== passwordField2) {
            setError('As senhas não batem!!')
            return
        }
        setError("");
        setInfo("");
        SetLoading(true);
        const result = await api.redefinePassword(passwordField, '123');
        SetLoading(false);
        if (result.error) {
            setError(result.error)
        } else {
            setInfo('Senha redefinida com sucesso!')
            setpasswordField2('')
            setpasswordField('')
        }

    }

    return (
        <>
            <Typography component="p" sx={{ textAlign: 'center', mt: 2, color: '#555' }}>
                Coloque a nova senha
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }} >
                <TextField
                    label="Digite sua nova senha"
                    type="password"
                    name="password"
                    required
                    fullWidth
                    autoFocus
                    sx={{ mb: 2 }}
                    onChange={e => setpasswordField(e.target.value)}
                    value={passwordField}
                    disabled={loading}
                />
                <TextField
                    label="Digite sua senha novamente"
                    type="password"
                    name="password2"
                    required
                    fullWidth
                    autoFocus
                    sx={{ mb: 2 }}
                    onChange={e => setpasswordField2(e.target.value)}
                    value={passwordField2}
                    disabled={loading}
                />

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}

                >Enviar</Button>

                {error &&
                    <Alert variant="filled" severity="error" sx={{ mt: 3 }}> {error} </Alert>
                }
                {info &&
                    <Alert variant="filled" severity="success" sx={{ mt: 3 }}> {info} </Alert>
                }

            </Box>
        </>
    );
}

export default Page;