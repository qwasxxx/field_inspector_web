import { Box, Typography } from '@mui/material';

export function SettingsPage() {
  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Настройки
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Раздел в разработке. Параметры приложения и интеграции будут добавлены позже.
      </Typography>
    </Box>
  );
}
