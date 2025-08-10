"use client";
import {
  LoginAction,
  LoginActionWithFacebook,
  LoginActionWithGoogle,
} from "@/actions/auth-action/action";
import { LoginSchema, LoginSchemaType } from "@/schemas/auth.schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
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
  Box,
} from "@mantine/core";
import { IconMail, IconPhone } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import CustomPhoneInput from "./CustomPhoneInput";
import Image from "next/image";

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
    <>
      <LoadingOverlay
        visible={isSubmitting}
        overlayProps={{
          blur: 2,
        }}
      />
      <Container size={"xs"} p={40} className="w-full mx-auto">
        <Box className="w-full h-20 relative mb-4">
          <Image
            src={"/TERRA-VIVA.svg"}
            fill
            alt="Logo"
            className="object-contain"
          />
        </Box>

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
            onClick={async () => {
              await LoginActionWithFacebook();
            }}
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

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="lg">
            {/* Email/Phone Input */}
            {type === "email" ? (
              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    error={fieldState.error?.message}
                    label="E-posta"
                    type="email"
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

            {/* Geçiş Butonu */}
            <Button
              type="button"
              radius="lg"
              variant="subtle"
              size="sm"
              color="gray"
              fw={500}
              leftSection={
                type === "email" ? (
                  <IconPhone size={16} />
                ) : (
                  <IconMail size={16} />
                )
              }
              styles={{
                root: {
                  alignSelf: "flex-start",
                  padding: "6px 12px",
                  height: "auto",
                  color: "#666",
                  "&:hover": {
                    backgroundColor: "#f8f9fa",
                    color: "#191414",
                  },
                },
              }}
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
              {type === "email"
                ? "Telefon ile giriş yap"
                : "E-posta ile giriş yap"}
            </Button>

            {/* Password Input */}
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

            {/* Error Message */}
            {errors.root && (
              <Text c="red" size="sm" fw={500}>
                {errors.root.message}
              </Text>
            )}

            {/* Login Button */}
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
              Giriş Yap
            </Button>

            {/* Divider */}
            <Divider my="xl" />

            {/* Sign Up Section */}
            <Stack gap="md" align="center">
              <Text size="md" fw={600} c="#191414" ta="center">
                Hesabınız yok mu?
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
                href="/register"
              >
                Kayıt Ol
              </Button>
            </Stack>
          </Stack>
        </form>
      </Container>
    </>
  );
};

export default LoginForm;
