import React from "react";

const ProfileSkeleton = () => {
  return (
    <main
      className="
        flex flex-col lg:flex-row               /* COLUNA no mobile — LINHA no desktop */
        gap-8 mx-auto p-4 sm:p-8 max-w-5xl 
        items-start animate-pulse
      "
    >
      {/* Sidebar */}
      <aside
        className="
          bg-[#1b1f27] p-8 sm:p-12 rounded-lg 
          w-full lg:w-64                       /* FULL no mobile — 256px no desktop */
          text-center
        "
      >
        <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-gray-600" />

        <div className="h-5 w-36 bg-gray-600 rounded mx-auto mb-3" />

        <div className="h-4 w-44 bg-gray-600 rounded mx-auto mb-6" />

        <div className="h-12 w-44 bg-gray-600 rounded mx-auto mb-6" />

        <div className="h-4 w-36 bg-gray-600 rounded mx-auto mb-2" />
        <div className="h-3 w-28 bg-gray-600 rounded mx-auto" />
      </aside>

      {/* Conteúdo principal */}
      <section className="flex-1 w-full">
        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-700 text-sm ml-2 mb-4">
          <div className="h-5 w-28 bg-gray-600 rounded-t-md" />
          <div className="h-5 w-28 bg-gray-600 rounded-t-md" />
          <div className="h-5 w-28 bg-gray-600 rounded-t-md" />
        </div>

        <section className="border border-gray-700 rounded-lg p-6 mt-[-1px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="col-span-1 sm:col-span-2 space-y-2">
              <div className="h-4 w-20 bg-gray-600 rounded" />
              <div className="h-11 w-full bg-gray-600 rounded" />
            </div>

            {/* CPF */}
            <div className="space-y-2">
              <div className="h-4 w-12 bg-gray-600 rounded" />
              <div className="h-11 w-full bg-gray-600 rounded" />
            </div>

            {/* Nascimento */}
            <div className="space-y-2">
              <div className="h-4 w-28 bg-gray-600 rounded" />
              <div className="h-11 w-full bg-gray-600 rounded" />
            </div>

            {/* Gênero */}
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-600 rounded" />
              <div className="h-11 w-full bg-gray-600 rounded" />
            </div>

            {/* Celular */}
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-600 rounded" />
              <div className="h-11 w-full bg-gray-600 rounded" />
            </div>

            {/* Botão */}
            <div className="col-span-1 sm:col-span-2 flex justify-end mt-2">
              <div className="h-10 w-28 bg-gray-600 rounded" />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
};

export default ProfileSkeleton;
