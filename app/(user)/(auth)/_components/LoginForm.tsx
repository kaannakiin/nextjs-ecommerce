"use client";
import { LoginAction } from "@/actions/auth-action/action";
import { LoginSchema, LoginSchemaType } from "@/schemas/auth.schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Container,
  Group,
  LoadingOverlay,
  Paper,
  PasswordInput,
  Text,
  TextInput,
} from "@mantine/core";
import { IconMail, IconPhone } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import CustomPhoneInput from "./CustomPhoneInput";

const LoginForm = () => {
  const {
    control,
    handleSubmit,
    watch,
    setError,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      type: "email",
      email: "",
      password: "",
    },
  });

  const type = watch("type") || "email";
  const { push } = useRouter();
  const params = useSearchParams();
  const onSubmit: SubmitHandler<LoginSchemaType> = async (data) => {
    try {
      const redirectUrl = params.get("redirectUrl") || "/";
      const response = await LoginAction(data);
      if (!response.success) {
        setError("root", {
          message: response.message,
        });
      } else {
        push(redirectUrl);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("root", {
        message: "Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.",
      });
    }
  };

  return (
    <Container size="xs" mt={"xl"}>
      <LoadingOverlay
        visible={isSubmitting}
        overlayProps={{
          blur: 2,
        }}
      />

      <Paper withBorder p="lg" radius="md" className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {type === "email" ? (
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  error={fieldState.error?.message}
                  label="E-Posta"
                  type="email"
                />
              )}
            />
          ) : (
            <Controller
              control={control}
              name="phone"
              render={({ field, fieldState }) => (
                <CustomPhoneInput
                  {...field}
                  error={fieldState.error?.message}
                  label="Telefon"
                />
              )}
            />
          )}
          <Button
            fullWidth
            type="button"
            leftSection={type === "email" ? <IconPhone /> : <IconMail />}
            onClick={() => {
              if (type === "email") {
                reset({
                  type: "phone",
                  phone: "",
                  password: "",
                });
              } else {
                reset({
                  type: "email",
                  email: "",
                  password: "",
                });
              }
            }}
          >
            {type === "email" ? "Telefon ile Giriş" : "E-Posta ile Giriş"}
          </Button>
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <PasswordInput
                {...field}
                error={fieldState.error?.message}
                label="Şifre"
              />
            )}
          />
          {errors.root && (
            <Text c={"red"} size="sm">
              {errors.root.message}
            </Text>
          )}
          <Group justify="space-between">
            <Link href={"/register"} className="flex items-center gap-1">
              <Text size="sm">Hesabınız yok mu ?</Text>
              <Text fw={700} size="sm">
                Kayıt Ol
              </Text>
            </Link>
            <Button size="sm" type="submit" radius={"md"}>
              Giriş Yap
            </Button>
          </Group>{" "}
        </form>
      </Paper>
    </Container>
  );
};

export default LoginForm;
