import { Fragment } from 'react';
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/model/useAuth';
import styles from './Sidebar.module.scss';

type NavItem = {
  label: string;
  path: string;
  dotColor: string;
};

const navItems: NavItem[] = [
  { label: 'Дашборд', path: '/', dotColor: '#1976d2' },
  { label: 'Сотрудники', path: '/employees', dotColor: '#2e7d32' },
  { label: 'Объекты', path: '/objects', dotColor: '#ed6c02' },
  { label: 'Задания', path: '/tasks', dotColor: '#9c27b0' },
  { label: 'Планирование обходов', path: '/planning', dotColor: '#5c6bc0' },
  { label: 'Чек-листы', path: '/checklist-builder', dotColor: '#00897b' },
  { label: 'Дефекты', path: '/defects', dotColor: '#d32f2f' },
  { label: 'Аналитика', path: '/analytics', dotColor: '#757575' },
  { label: 'Отчёты', path: '/reports', dotColor: '#9e9e9e' },
  { label: 'Настройки', path: '/settings', dotColor: '#78909c' },
];

type Props = {
  collapsed: boolean;
};

function isNavSelected(pathname: string, path: string): boolean {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function Sidebar({ collapsed }: Props) {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <Box
      className={styles.root}
      sx={{
        pt: 2,
        px: collapsed ? 0.5 : 0,
      }}
    >
      {!collapsed ? (
        <Box sx={{ px: 2.5, pb: 2 }}>
          <Typography variant="h6" component="div" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            РМК Обходчик
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mt: 0.5 }}>
            Панель администратора
          </Typography>
        </Box>
      ) : null}

      {!collapsed ? (
        <Typography variant="overline" className={styles.sectionLabel}>
          Разделы
        </Typography>
      ) : null}

      <List dense disablePadding sx={{ px: collapsed ? 0.5 : 1.5, flex: 1 }}>
        {navItems.map((item) => {
          const selected = isNavSelected(location.pathname, item.path);
          const button = (
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={selected}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 2,
                minHeight: 48,
                color: 'common.white',
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.18)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 40,
                  color: 'inherit',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: item.dotColor,
                    flexShrink: 0,
                  }}
                />
              </ListItemIcon>
              {!collapsed ? (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: selected ? 700 : 500 }}
                />
              ) : null}
            </ListItemButton>
          );

          return (
            <Fragment key={item.path}>
              {collapsed ? (
                <Tooltip title={item.label} placement="right">
                  <Box component="span" sx={{ display: 'block' }}>
                    {button}
                  </Box>
                </Tooltip>
              ) : (
                button
              )}
            </Fragment>
          );
        })}
      </List>

      <Box className={styles.footer}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mb: 1 }} />
        {collapsed ? (
          <Tooltip title="Выйти" placement="right">
            <span>
              <ListItemButton
                onClick={() => logout()}
                sx={{
                  borderRadius: 2,
                  mx: 0.5,
                  justifyContent: 'center',
                  color: 'common.white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}>
                  <LogoutRoundedIcon fontSize="small" />
                </ListItemIcon>
              </ListItemButton>
            </span>
          </Tooltip>
        ) : (
          <ListItemButton
            onClick={() => logout()}
            sx={{
              borderRadius: 2,
              mx: 1.5,
              color: 'common.white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Выйти" />
          </ListItemButton>
        )}
      </Box>
    </Box>
  );
}
