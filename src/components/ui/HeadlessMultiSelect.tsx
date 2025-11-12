"use client";

import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import {Spinner} from '@/components/ui/simpleSpinner';

type Option = {
  id: number;
  nome: string;
};

type HeadlessMultiSelectProps = {
  options: Option[];
  selectedOptions: Option[];
  onChange: (selected: Option[]) => void;
  placeholder: string;
  disabled?: boolean;
  isLoading?: boolean; // <-- NOVA PROP
};

export const HeadlessMultiSelect = ({
  options,
  selectedOptions,
  onChange,
  placeholder,
  disabled = false,
  isLoading = false, // <-- NOVA PROP
}: HeadlessMultiSelectProps) => {
  return (
    <Listbox
      value={selectedOptions}
      onChange={onChange}
      multiple
      disabled={disabled || isLoading} // <-- Desabilita também se estiver carregando
      by="id"
    >
      <div className="relative w-full">
        <Listbox.Button className="w-full p-3 bg-[#2A303C] border border-gray-700 text-left text-gray-400 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center">
          <span className="truncate">
            {/* LÓGICA ATUALIZADA PARA MOSTRAR 'CARREGANDO...' */}
            {isLoading ? (
              <Spinner size="sm" />
            ) : selectedOptions.length > 0 ? (
              selectedOptions.map(opt => opt.nome).join(', ')
            ) : (
              placeholder
            )}
          </span>
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Listbox.Button>
        
        <Listbox.Options className="absolute z-10 w-full mt-1 bg-[#2A303C] border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto focus:outline-none">
          {isLoading ? (
            <div className="text-gray-400 text-sm px-4 py-2">Carregando opções...</div>
          ) : (
            options.map((option) => (
              <Listbox.Option
                key={option.id}
                value={option}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    active ? 'bg-[#1D232D] text-white' : 'text-gray-200'
                  }`
                }
                title={option.nome}
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate text-sm ${selected ? 'font-medium' : 'font-normal'}`}>
                      {option.nome}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))
          )}
        </Listbox.Options>
      </div>
    </Listbox>
  );
};