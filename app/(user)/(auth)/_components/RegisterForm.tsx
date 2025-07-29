"use client";

import { RegisterAction } from "@/actions/auth-action/action";
import { RegisterSchema, RegisterSchemaType } from "@/schemas/auth.schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Container,
  Group,
  LoadingOverlay,
  Paper,
  PasswordInput,
  SimpleGrid,
  Text,
  TextInput,
} from "@mantine/core";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import CustomPhoneInput from "./CustomPhoneInput";

import { IconBrandFacebook, IconBrandGoogle } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const RegisterForm = () => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<RegisterSchemaType>({ resolver: zodResolver(RegisterSchema) });

  const { push } = useRouter();
  const params = useSearchParams();
  const onSubmit: SubmitHandler<RegisterSchemaType> = async (data) => {
    try {
      const response = await RegisterAction(data);
      if (!response.success) {
        setError("root", {
          message: response.message,
        });
      }
      if (response.success) {
        const redirectUrl = params.get("redirectUrl") || "/";
        push(redirectUrl);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("root", {
        message: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.",
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
        <Group grow mb={"md"} px={0}>
          <Button variant="default" leftSection={<IconBrandGoogle size={24} />}>
            Google
          </Button>
          <Button
            variant="default"
            leftSection={<IconBrandFacebook size={24} color="blue.6" />}
          >
            Facebook
          </Button>
        </Group>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <SimpleGrid cols={{ xs: 1, md: 2 }}>
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  error={fieldState.error?.message}
                  label="İsim"
                />
              )}
            />
            <Controller
              control={control}
              name="surname"
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  error={fieldState.error?.message}
                  label="Soyisim"
                />
              )}
            />
          </SimpleGrid>
          <Controller
            control={control}
            name="phone"
            render={({ field, fieldState }) => (
              <CustomPhoneInput
                {...field}
                value={field.value || ""}
                label="Telefon Numarası"
                error={fieldState.error?.message}
                onChange={(value) => field.onChange(value)}
                onBlur={field.onBlur}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                value={field.value || ""}
                type="email"
                error={fieldState.error?.message}
                label="Email"
              />
            )}
          />
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
          />{" "}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <PasswordInput
                {...field}
                error={fieldState.error?.message}
                label="Şifre Tekrarı"
              />
            )}
          />
          {errors.root && (
            <Text c={"red"} size="sm">
              {errors.root.message}
            </Text>
          )}
          <Group justify="space-between">
            <Link href={"/login"} className="flex items-center gap-1">
              <Text size="sm">Hesabınız var mı ?</Text>
              <Text fw={700} size="sm">
                Giriş Yap
              </Text>
            </Link>
            <Button size="sm" type="submit" radius={"md"}>
              Kayıt Ol
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
};

export default RegisterForm;
