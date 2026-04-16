import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/Sidebar/Sidebar';
import styles from './MainLayout.module.scss';

const DRAWER_EXPANDED = 280;
const STORAGE_KEY = 'fi_sidebar_collapsed';

function readCollapsed(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleDrawer = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  const drawerWidth = collapsed ? 0 : DRAWER_EXPANDED;

  return (
    <Box className={styles.shell}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            minWidth: collapsed ? 0 : undefined,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderRight: collapsed ? 'none' : undefined,
          },
        }}
      >
        {!collapsed ? <Sidebar /> : null}
      </Drawer>

      <Box
        component="main"
        className={styles.main}
        sx={{
          flexGrow: 1,
          minWidth: 0,
          bgcolor: 'background.default',
        }}
      >
        <AppBar
          position="fixed"
          elevation={0}
          color="inherit"
          sx={{
            left: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            transition: (theme) =>
              theme.transitions.create(['left', 'width'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          }}
        >
          <Toolbar sx={{ minHeight: 72, gap: 1 }}>
            <IconButton
              color="inherit"
              aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
              edge="start"
              onClick={toggleDrawer}
              sx={{ color: 'text.primary' }}
            >
              {collapsed ? (
                <ChevronRightRoundedIcon />
              ) : (
                <ChevronLeftRoundedIcon />
              )}
            </IconButton>
            <Typography variant="h6" component="h1" color="text.primary">
              РМК Обходчик
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              Панель администратора
            </Typography>
          </Toolbar>
        </AppBar>

        <Toolbar sx={{ minHeight: 72 }} />
        <Box className={styles.content}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
