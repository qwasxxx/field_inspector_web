import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/model/useAuth';
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/model/validation';
import { API_BASE } from '@/shared/api/client';
import styles from './AuthForm.module.scss';

export function AuthForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    try {
      await login(values);
      navigate('/', { replace: true });
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : 'Не удалось выполнить вход',
      );
    }
  };

  return (
    <Card className={styles.card} elevation={0}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <LoginRoundedIcon />
          </Avatar>
        }
        title={
          <Typography variant="h5" component="span" fontWeight={700}>
            Вход руководителя ПЗ
          </Typography>
        }
        subheader="Веб-панель «Мобильный офис» — управление обходами и контроль результатов"
      />
      <CardContent sx={{ pt: 0 }}>
        <Alert severity="info" icon={false} sx={{ mb: 2, borderRadius: 2 }}>
          {API_BASE ? (
            <>
              Вход через API: <strong>{API_BASE}</strong>. Учётная запись по
              умолчанию из сида бэкенда (см. переменные{' '}
              <code>SEED_ADMIN_EMAIL</code> / <code>SEED_ADMIN_PASSWORD</code>).
            </>
          ) : (
            <>
              Демо без API: валидный email и пароль сохраняют флаг в{' '}
              <strong>localStorage</strong>.
            </>
          )}
        </Alert>
        {submitError ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {submitError}
          </Alert>
        ) : null}

        <Box
          component="form"
          className={styles.form}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              fullWidth
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
              {...register('email')}
            />

            <TextField
              label="Пароль"
              type="password"
              autoComplete="current-password"
              fullWidth
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
              {...register('password')}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={!isValid}
              endIcon={<LoginRoundedIcon />}
            >
              Войти
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
