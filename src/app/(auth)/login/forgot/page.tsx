"use client"

import { api } from "@/lib/api";
import { Box, Button, TextField, Typography, Link as MuiLink, Alert } from "@mui/material";
import Link from "next/link";
import { FormEvent, useState } from "react";

const Page = () => {
    const [error, setError] = useState('')
    const [loading, SetLoading] = useState(false);
    const [emailField, setEmailField] = useState('');
    const [info, setInfo] = useState('')

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!emailField) {
            setError('Preencha o email!')
        }
        setError("");
        setInfo("");
        SetLoading(true);
        const result = await api.forgotPassword(emailField);
        SetLoading(false);
        if (result.error) {
            setError(result.error)
        } else {
            setInfo('Eviamos um email para recuperação')
        }

    }

    return (
        <>
            <Typography component="p" sx={{ textAlign: 'center', mt: 2, color: '#555' }}>
                Digite seus dados.
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }} >
                <TextField
                    label="Digite seu Email"
                    name="email"
                    required
                    fullWidth
                    autoFocus
                    sx={{ mb: 2 }}
                    onChange={e => setEmailField(e.target.value)}
                    value={emailField}
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