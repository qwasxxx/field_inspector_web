import { Fragment } from 'react';
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import type { LucideIcon } from 'lucide-react';
import { GitBranch } from 'lucide-react';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/model/useAuth';
import styles from './Sidebar.module.scss';

type NavItem = {
  label: string;
  path: string;
  Icon?: LucideIcon;
};

const navItems: NavItem[] = [
  { label: 'Дашборд', path: '/' },
  { label: 'Обходчики', path: '/workers' },
  { label: 'Сотрудники', path: '/employees' },
  { label: 'Объекты', path: '/objects' },
  { label: 'Схема объектов', path: '/topology', Icon: GitBranch },
  { label: 'Задания', path: '/tasks' },
  { label: 'Входящие запросы', path: '/task-requests' },
  { label: 'Планирование обходов', path: '/planning' },
  { label: 'Чек-листы', path: '/checklist-builder' },
  { label: 'Дефекты', path: '/defects' },
  { label: 'Аналитика', path: '/analytics' },
  { label: 'Отчёты', path: '/reports' },
  { label: 'Настройки', path: '/settings' },
];

function isNavSelected(pathname: string, path: string): boolean {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <Box
      className={styles.root}
      sx={{
        pt: 2,
        px: 0,
      }}
    >
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Typography
          variant="h6"
          component="div"
          fontWeight={700}
          className={styles.brandTitle}
          sx={{ lineHeight: 1.2 }}
        >
          РМК Обходчик
        </Typography>
        <Typography
          variant="caption"
          className={styles.brandSubtitle}
          sx={{ display: 'block', mt: 0.5 }}
        >
          Панель администратора
        </Typography>
      </Box>

      <Typography variant="overline" className={styles.sectionLabel}>
        Разделы
      </Typography>

      <List dense disablePadding sx={{ px: 1.5, flex: 1 }}>
        {navItems.map((item) => {
          const selected = isNavSelected(location.pathname, item.path);
          const Icon = item.Icon;
          const button = (
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={selected}
              className={styles.navItem}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                px: 2,
                minHeight: 48,
              }}
            >
              {Icon ? (
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  <Icon size={20} strokeWidth={1.75} />
                </ListItemIcon>
              ) : null}
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: selected ? 700 : 500 }}
              />
            </ListItemButton>
          );

          return <Fragment key={item.path}>{button}</Fragment>;
        })}
      </List>

      <Box className={styles.footer}>
        <Divider className={styles.footerDivider} />
        <ListItemButton
          onClick={() => void logout()}
          className={styles.logoutItem}
          sx={{
            borderRadius: 2,
            mx: 1.5,
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Выйти" />
        </ListItemButton>
      </Box>
    </Box>
  );
}
