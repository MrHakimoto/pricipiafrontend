import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto'; // Para gerar nomes de arquivo únicos

export async function POST(request: Request) {
  try {
    // 1. Pega o arquivo enviado pelo frontend
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    // 2. Pega as credenciais das variáveis de ambiente
    const storageZoneName = process.env.BUNNY_STORAGE_ZONE_NAME;
    const apiKey = process.env.BUNNY_STORAGE_API_KEY;
    const storageHostname = process.env.BUNNY_STORAGE_HOSTNAME;

    if (!storageZoneName || !apiKey || !storageHostname) {
        throw new Error("Credenciais do Bunny.net não configuradas no servidor.");
    }
    
    // 3. Monta um nome de arquivo único para evitar sobreposições
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    
    // 4. Constrói a URL de destino no Bunny.net Storage
    const uploadUrl = `https://${storageHostname}/${storageZoneName}/${uniqueFileName}`;
    
    // 5. Converte o arquivo para um buffer para poder enviá-lo
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 6. Envia o arquivo para o Bunny.net usando um PUT request
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': file.type,
      },
      body: fileBuffer,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha no upload para o Bunny.net: ${errorText}`);
    }

    // 7. Constrói a URL pública final usando seu CDN personalizado
    const publicUrl = `${process.env.NEXT_PUBLIC_CDN_URL}/${uniqueFileName}`;

    // 8. Retorna a URL pública para o frontend
    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error: any) {
    console.error("Erro no upload:", error);
    return NextResponse.json({ error: error.message || "Falha no upload." }, { status: 500 });
  }
}