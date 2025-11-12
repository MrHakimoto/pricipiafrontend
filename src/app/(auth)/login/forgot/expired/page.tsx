"use client"

import { api } from "@/lib/api";
import { Box, Button, TextField, Typography, Link as MuiLink, Alert } from "@mui/material";
import Link from "next/link";
import { FormEvent, useState } from "react";

const Page = () => {


    return (
        <>
            <Alert variant="filled" severity="error" sx={{ mt: 3, mb: 5 }}> Deu Problema no processo, amigo! Refaça!  </Alert>

            <MuiLink href="/login/forgot" component={Link} variant="button"> Esqueci minha senha</MuiLink>
        </>
    );
}

export default Page;