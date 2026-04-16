import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import { Link as RouterLink } from 'react-router-dom';
import styles from './PlanningPage.module.scss';

/**
 * Заглушка под сценарий «Создание обходов, назначение на смену / день»
 * из потока руководителя производственного звена.
 * Целевая интеграция — через сервисы мобильного офиса (бэкенд).
 */
export function PlanningPage() {
  return (
    <Stack spacing={3} className={styles.wrap}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Планирование обходов
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Создание заданий и назначение на смену или день в целевой системе выполняется через{' '}
          <strong>сервисы мобильного офиса</strong>. После появления API здесь появятся календарь,
          смены и выбор маршрутов для бригады обходчиков.
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <CalendarMonthOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6" gutterBottom>
                Сейчас (MVP)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Подготовьте шаблоны чек-листов в конструкторе — их смогут выбирать при
                проверке маршрутов до внедрения назначений из сервиса.
              </Typography>
              <Button
                component={RouterLink}
                to="/checklist-builder"
                variant="contained"
                startIcon={<FactCheckOutlinedIcon />}
              >
                Открыть конструктор чек-листов
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
