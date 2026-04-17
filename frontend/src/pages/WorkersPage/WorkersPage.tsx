import AddRoundedIcon from '@mui/icons-material/AddRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkers } from '@/features/factory/hooks/useWorkers';
import { fetchWorkers } from '@/features/factory/services/workersApi';
import { createWorkerAccount } from '@/features/factory/services/workersAdminApi';
import { API_BASE } from '@/shared/api/client';
import { formatDateTime } from '@/shared/lib/formatDate';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';
import {
  exportOutlineButtonSx,
  exportToExcel,
  formatDateForFilename,
} from '@/utils/exportUtils';

export function WorkersPage() {
  const navigate = useNavigate();
  const { rows, loading, error, reload } = useWorkers({ onlyActive: false });
  const configured = isSupabaseConfigured();
  const apiReady =
    configured && (Boolean(API_BASE) || Boolean(import.meta.env.DEV));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openDialog = () => {
    setFormError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setFormError(null);
  };

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setEmployeeCode('');
    setEmail('');
    setPassword('');
    setIsActive(true);
  };

  const handleExportExcel = async () => {
    const { data, error: err } = await fetchWorkers({ onlyActive: false });
    if (err) {
      window.alert(err);
      return;
    }
    const exportRows = (data ?? []).map((p) => [
      p.full_name ?? '—',
      p.username ?? '—',
      p.employee_code ?? '—',
      p.role ?? '—',
      p.is_active === true ? 'Да' : p.is_active === false ? 'Нет' : '—',
      formatDateTime(p.created_at as string | undefined),
    ]);
    exportToExcel(
      [
        {
          name: 'Обходчики',
          headers: ['ФИО', 'Логин', 'Код сотрудника', 'Роль', 'Активен', 'Дата создания'],
          rows: exportRows,
        },
      ],
      `workers_${formatDateForFilename()}.xlsx`,
    );
  };

  const handleCreate = async () => {
    setFormError(null);
    if (!fullName.trim()) {
      setFormError('Укажите ФИО.');
      return;
    }
    if (!username.trim()) {
      setFormError('Укажите логин.');
      return;
    }
    if (!employeeCode.trim()) {
      setFormError('Укажите код сотрудника.');
      return;
    }
    if (!email.trim()) {
      setFormError('Укажите email.');
      return;
    }
    if (password.length < 6) {
      setFormError('Пароль не короче 6 символов.');
      return;
    }

    setSaving(true);
    try {
      const { error: err } = await createWorkerAccount({
        full_name: fullName.trim(),
        username: username.trim(),
        employee_code: employeeCode.trim(),
        email: email.trim(),
        password,
        is_active: isActive,
      });
      if (err) {
        setFormError(err);
        return;
      }
      resetForm();
      setDialogOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Обходчики
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Полевые исполнители с доступом в мобильное приложение. По строке можно перейти к назначению обхода.
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openDialog}
          disabled={!configured || !apiReady}
        >
          Создать обходчика
        </Button>
        <Button
          variant="outlined"
          startIcon={<Download size={16} style={{ marginRight: 6 }} />}
          onClick={() => void handleExportExcel()}
          disabled={!configured}
          sx={exportOutlineButtonSx}
        >
          Экспорт Excel
        </Button>
      </Stack>

      {!configured ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Список недоступен: не настроено подключение к данным.
        </Alert>
      ) : null}
      {configured && !import.meta.env.DEV && !API_BASE ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Создание учётных записей обходчиков на этой среде требует настройки сервера. Обратитесь к
          администратору.
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <CircularProgress size={28} />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ФИО</TableCell>
                <TableCell>Логин</TableCell>
                <TableCell>Код сотрудника</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell>Активен</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    {configured ? 'Нет данных или таблица недоступна.' : '—'}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => (
                  <TableRow
                    key={r.id != null ? String(r.id) : `w-${idx}`}
                    hover
                    sx={{ cursor: r.id ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (r.id) {
                        navigate(`/tasks/create?workerId=${encodeURIComponent(String(r.id))}`);
                      }
                    }}
                  >
                    <TableCell>{r.full_name ?? '—'}</TableCell>
                    <TableCell>{r.username ?? '—'}</TableCell>
                    <TableCell>{r.employee_code ?? '—'}</TableCell>
                    <TableCell>{r.role ?? '—'}</TableCell>
                    <TableCell>
                      {r.is_active === true ? 'Да' : r.is_active === false ? 'Нет' : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Новый обходчик</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError ? (
              <Alert severity="error" onClose={() => setFormError(null)}>
                {formError}
              </Alert>
            ) : null}
            <TextField
              label="ФИО"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              fullWidth
              autoComplete="name"
            />
            <TextField
              label="Логин (username)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              autoComplete="username"
            />
            <TextField
              label="Код сотрудника"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
            />
            <TextField
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="new-password"
              helperText="Не менее 6 символов."
            />
            <FormControlLabel
              control={
                <Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              }
              label="Активен"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Отмена
          </Button>
          <Button
            onClick={() => void handleCreate()}
            variant="contained"
            disabled={saving || !configured || !apiReady}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
