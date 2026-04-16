import { Box, Typography } from '@mui/material';

type Props = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: Props) {
  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      ) : (
        <Typography variant="body1" color="text.secondary">
          Раздел в разработке. Данные будут поступать из сервисов мобильного офиса
          после интеграции.
        </Typography>
      )}
    </Box>
  );
}
