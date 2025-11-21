import DefinirSenhaPageInner from "@/components/DefinirSenhaPageInner";
import { Suspense } from "react";

export default function Page() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <DefinirSenhaPageInner />
        </Suspense>
    );
}
