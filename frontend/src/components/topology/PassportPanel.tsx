import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { EquipmentNodeRow } from '@/types/topology';
import { PassportCurrentData } from '@/components/topology/PassportCurrentData';
import { PassportHistory } from '@/components/topology/PassportHistory';
import { PassportInfo } from '@/components/topology/PassportInfo';
import { exportOutlineButtonSx, generateEquipmentPassportPdf } from '@/utils/exportUtils';

export type PassportPanelProps = {
  node: EquipmentNodeRow | null;
  open: boolean;
  onClose: () => void;
};

export function PassportPanel({ node, open, onClose }: PassportPanelProps) {
  const [tab, setTab] = useState(0);

  useEffect(() => {
    setTab(0);
  }, [node?.id]);

  return (
    <Drawer
      anchor="right"
      open={open && Boolean(node)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 420,
          maxWidth: '100%',
          boxSizing: 'border-box',
        },
      }}
      transitionDuration={300}
    >
      {node ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" component="h2" fontWeight={700} noWrap sx={{ flex: 1, minWidth: 0 }}>
              {node.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Download size={16} style={{ marginRight: 4 }} />}
                onClick={() => void generateEquipmentPassportPdf(node)}
                sx={{ ...exportOutlineButtonSx, py: 0.5, px: 1, fontSize: '0.8125rem' }}
              >
                ⬇ PDF
              </Button>
              <IconButton aria-label="закрыть" onClick={onClose} size="small">
                <CloseRoundedIcon />
              </IconButton>
            </Box>
          </Box>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
          >
            <Tab label="Текущие данные" />
            <Tab label="История / График" />
            <Tab label="Паспорт" />
          </Tabs>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {tab === 0 ? <PassportCurrentData node={node} /> : null}
            {tab === 1 ? <PassportHistory node={node} /> : null}
            {tab === 2 ? <PassportInfo node={node} /> : null}
          </Box>
        </Box>
      ) : null}
    </Drawer>
  );
}
