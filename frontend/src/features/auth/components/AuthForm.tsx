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
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/model/useAuth';
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/model/validation';
import styles from './AuthForm.module.scss';

export function AuthForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = () => {
    login();
    navigate('/', { replace: true });
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
          Демо: валидный email и пароль сохраняют сессию в{' '}
          <strong>localStorage</strong>. Бэкенд не используется.
        </Alert>

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
