"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function ProfileCard({ name, email }: { name: string; email: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >

            {name
                .split(" ")
                .map(n => n[0])
                .join("")
                .toUpperCase()}
            <Card className="bg-gradient-to-b from-gray-900 to-gray-950 text-white flex flex-col items-center p-6 rounded-2xl shadow-xl">
                <Avatar className="w-24 h-24 ring-4 ring-blue-600/30">
                    <AvatarImage src="" alt="Foto" />
                    <AvatarFallback className="text-xl">MJ</AvatarFallback>
                </Avatar>
                <div className="mt-4 text-center">
                    <h2 className="text-xl font-semibold tracking-wide">{name}</h2>
                    <p className="text-gray-400 text-sm">{email}</p>
                </div>
                <CardContent className="mt-6 w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 transition-all rounded-xl">
                        Ver minhas estatísticas
                    </Button>
                </CardContent>
                <CardFooter className="text-center flex flex-col gap-1">
                    <p className="font-semibold">
                        Nível 19 <span className="font-normal">|</span> Ranking 1
                    </p>
                    <span className="text-gray-400 text-sm">desde 01/01/2025</span>
                </CardFooter>
            </Card>
        </motion.div>
    )
}
