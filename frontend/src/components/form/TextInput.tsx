import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LucideProps } from "lucide-react";
import { ComponentType, InputHTMLAttributes, RefAttributes } from "react";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";

interface TextInputProps<TFieldValues extends FieldValues>
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: FieldPath<TFieldValues>;
  Icon?: ComponentType<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
}

export function TextInput<TFieldValues extends FieldValues>({
  label,
  name,
  placeholder,
  className,
  type = "text",
  Icon,
  ...props
}: TextInputProps<TFieldValues>) {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex-1">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {Icon ? (
              <div className="relative">
                <span className="absolute transform -translate-y-1/2 left-2 top-1/2">
                  <Icon size={20} />
                </span>
                <Input
                  className={cn(className, "pl-10")}
                  placeholder={placeholder}
                  type={type}
                  {...field}
                  {...props}
                  style={{}}
                />
              </div>
            ) : (
              <Input
                className={cn(className)}
                placeholder={placeholder}
                type={type}
                {...field}
                {...props}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
