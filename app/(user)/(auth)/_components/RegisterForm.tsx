"use client";

import {
  LoginActionWithFacebook,
  LoginActionWithGoogle,
  RegisterAction,
} from "@/actions/auth-action/action";
import { RegisterSchema, RegisterSchemaType } from "@/schemas/auth.schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Container,
  Divider,
  LoadingOverlay,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import CustomPhoneInput from "./CustomPhoneInput";

const RegisterForm = () => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      surname: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

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
    <>
      <LoadingOverlay
        visible={isSubmitting}
        overlayProps={{
          blur: 2,
        }}
      />

      <Container size={"xs"} p={40} className="w-full mx-auto">
        {/* Logo */}
        <Box className="w-full h-20 relative mb-4">
          <Image
            src={"/TERRA-VIVA.svg"}
            fill
            alt="Logo"
            className="object-contain"
          />
        </Box>

        {/* Sosyal Medya Butonları */}
        <Stack gap="sm" mb={32}>
          <Button
            size="lg"
            radius="xl"
            variant="outline"
            h={52}
            fw={600}
            fz="sm"
            styles={{
              root: {
                borderColor: "#d9d9d9",
                backgroundColor: "white",
                color: "#191414",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "#191414",
                  backgroundColor: "#f8f9fa",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                },
              },
              section: {
                marginRight: "12px",
              },
            }}
            leftSection={
              <svg
                width="20"
                height="20"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#FFC107"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                />
              </svg>
            }
            onClick={async () => {
              await LoginActionWithGoogle();
            }}
          >
            Google ile devam et
          </Button>

          <Button
            size="lg"
            radius="xl"
            h={52}
            fw={600}
            fz="sm"
            onClick={async () => {
              await LoginActionWithFacebook();
            }}
            styles={{
              root: {
                backgroundColor: "#1877F2",
                border: "none",
                color: "white",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "#166fe5",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 16px rgba(24, 119, 242, 0.25)",
                },
              },
              section: {
                marginRight: "12px",
              },
            }}
            leftSection={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            }
          >
            Facebook ile devam et
          </Button>
        </Stack>

        <Divider
          my={"xs"}
          label="VEYA"
          labelPosition="center"
          styles={{
            label: {
              color: "#999",
              fontSize: "12px",
              fontWeight: 600,
            },
          }}
        />

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="lg">
            {/* Ad Soyad */}
            <SimpleGrid cols={2} spacing="md">
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    error={fieldState.error?.message}
                    label="İsim"
                    size="md"
                    radius="lg"
                    styles={{
                      label: {
                        fontWeight: 600,
                        marginBottom: "8px",
                        color: "#191414",
                      },
                      input: {
                        height: "48px",
                        fontSize: "14px",
                        border: "2px solid #d9d9d9",
                        "&:focus": {
                          borderColor: "#1db954",
                        },
                      },
                    }}
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
                    size="md"
                    radius="lg"
                    styles={{
                      label: {
                        fontWeight: 600,
                        marginBottom: "8px",
                        color: "#191414",
                      },
                      input: {
                        height: "48px",
                        fontSize: "14px",
                        border: "2px solid #d9d9d9",
                        "&:focus": {
                          borderColor: "#1db954",
                        },
                      },
                    }}
                  />
                )}
              />
            </SimpleGrid>

            {/* Telefon */}
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

            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  value={field.value || ""}
                  type="email"
                  error={fieldState.error?.message}
                  label="E-posta"
                  size="md"
                  radius="lg"
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: "8px",
                      color: "#191414",
                    },
                    input: {
                      height: "48px",
                      fontSize: "14px",
                      border: "2px solid #d9d9d9",
                      "&:focus": {
                        borderColor: "#1db954",
                      },
                    },
                  }}
                />
              )}
            />

            {/* Şifre */}
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <PasswordInput
                  {...field}
                  error={fieldState.error?.message}
                  label="Şifre"
                  size="md"
                  radius="lg"
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: "8px",
                      color: "#191414",
                    },
                    input: {
                      height: "48px",
                      fontSize: "14px",
                      border: "2px solid #d9d9d9",
                      "&:focus": {
                        borderColor: "#1db954",
                      },
                    },
                  }}
                />
              )}
            />

            {/* Şifre Tekrarı */}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <PasswordInput
                  {...field}
                  error={fieldState.error?.message}
                  label="Şifre Tekrarı"
                  size="md"
                  radius="lg"
                  styles={{
                    label: {
                      fontWeight: 600,
                      marginBottom: "8px",
                      color: "#191414",
                    },
                    input: {
                      height: "48px",
                      fontSize: "14px",
                      border: "2px solid #d9d9d9",
                      "&:focus": {
                        borderColor: "#1db954",
                      },
                    },
                  }}
                />
              )}
            />

            {/* Error Message */}
            {errors.root && (
              <Text c="red" size="sm" fw={500}>
                {errors.root.message}
              </Text>
            )}

            {/* Register Button */}
            <Button
              size="lg"
              type="submit"
              radius="xl"
              h={52}
              fw={700}
              fz="md"
              mt="md"
              styles={{
                root: {
                  backgroundColor: "#1db954",
                  color: "white",
                  border: "none",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#1ed760",
                    transform: "scale(1.02)",
                  },
                  "&:active": {
                    transform: "scale(0.98)",
                  },
                },
              }}
            >
              Kayıt Ol
            </Button>

            {/* Divider */}
            <Divider my="xl" />

            {/* Login Section */}
            <Stack gap="md" align="center">
              <Text size="md" fw={600} c="#191414" ta="center">
                Hesabınız var mı?
              </Text>
              <Button
                radius="xl"
                fw={600}
                size="lg"
                h={52}
                variant="outline"
                fullWidth
                styles={{
                  root: {
                    borderColor: "#d9d9d9",
                    color: "#191414",
                    backgroundColor: "transparent",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "#191414",
                      backgroundColor: "#f8f9fa",
                      transform: "translateY(-1px)",
                    },
                  },
                }}
                component={Link}
                href="/login"
              >
                Giriş Yap
              </Button>
            </Stack>
          </Stack>
        </form>
      </Container>
    </>
  );
};

export default RegisterForm;
