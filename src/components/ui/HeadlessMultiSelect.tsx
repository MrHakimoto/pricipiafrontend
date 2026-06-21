"use client";

import { Listbox } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Spinner } from "@/components/ui/simpleSpinner";

export type Option = {
  id: string | number;
  nome: string;
};

type HeadlessMultiSelectProps = {
  options: Option[];
  selectedOptions: Option[];
  onChange: (selected: Option[]) => void;
  placeholder: string;
  disabled?: boolean;
  isLoading?: boolean;
};

export const HeadlessMultiSelect = ({
  options,
  selectedOptions,
  onChange,
  placeholder,
  disabled = false,
  isLoading = false,
}: HeadlessMultiSelectProps) => {
  return (
    <Listbox
      value={selectedOptions}
      onChange={onChange}
      multiple
      disabled={disabled || isLoading}
      by="id"
    >
      <div className="relative w-full">
        <Listbox.Button className="flex w-full items-center justify-between rounded-md border border-gray-700 bg-[#2A303C] p-3 text-left text-gray-400 disabled:cursor-not-allowed disabled:opacity-50">
          <span className="truncate">
            {isLoading ? (
              <Spinner size="sm" />
            ) : selectedOptions.length > 0 ? (
              selectedOptions.map((opt) => opt.nome).join(", ")
            ) : (
              placeholder
            )}
          </span>

          <ChevronUpDownIcon
            className="h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </Listbox.Button>

        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-600 bg-[#2A303C] shadow-lg focus:outline-none">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-400">
              Carregando opções...
            </div>
          ) : (
            options.map((option) => (
              <Listbox.Option
                key={String(option.id)}
                value={option}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    active ? "bg-[#1D232D] text-white" : "text-gray-200"
                  }`
                }
                title={option.nome}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate text-sm ${
                        selected ? "font-medium" : "font-normal"
                      }`}
                    >
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