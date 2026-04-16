import { Box, Container, Typography } from '@mui/material';
import FactoryOutlinedIcon from '@mui/icons-material/FactoryOutlined';
import { AuthForm } from '@/features/auth/components/AuthForm';
import styles from './LoginPage.module.scss';

export function LoginPage() {
  return (
    <Box className={styles.page}>
      <Container maxWidth="sm" className={styles.inner}>
        <Box className={styles.hero}>
          <Box className={styles.heroIcon}>
            <FactoryOutlinedIcon sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="h4" component="p" fontWeight={700} gutterBottom>
            Мобильный офис
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Руководитель производственного звена — взаимодействие с обходчиками в цехе
            (планирование, шаблоны, контроль данных). Мобильное приложение — для полевых
            сотрудников.
          </Typography>
        </Box>
        <AuthForm />
      </Container>
    </Box>
  );
}
