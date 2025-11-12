"use client"

import { motion } from "framer-motion"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

export function ProfileForm() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-t-xl">
          <TabsTrigger value="dados">Dados pessoais</TabsTrigger>
          <TabsTrigger value="acesso">Dados de acesso</TabsTrigger>
          <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
        </TabsList>
        <TabsContent value="dados">
          <Card className="bg-gradient-to-b from-gray-900 to-gray-950 text-white border-gray-800 rounded-2xl shadow-xl">
            <CardHeader className="hidden" />
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Nome</label>
                <Input className="bg-gray-800/40 border-gray-700 focus:ring-2 focus:ring-blue-500 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">CPF</label>
                <Input className="bg-gray-800/40 border-gray-700 focus:ring-2 focus:ring-blue-500 rounded-lg max-w-xs" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Nascimento</label>
                  <Input className="bg-gray-800/40 border-gray-700 focus:ring-2 focus:ring-blue-500 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Gênero</label>
                  <Input className="bg-gray-800/40 border-gray-700 focus:ring-2 focus:ring-blue-500 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Celular</label>
                  <Input className="bg-gray-800/40 border-gray-700 focus:ring-2 focus:ring-blue-500 rounded-lg" />
                </div>
              </div>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-500 rounded-xl">
                Salvar <Save className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
