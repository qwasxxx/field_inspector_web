import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Box,
  Checkbox,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { ObjectNode } from '@/features/objects/types';

const TYPE_LABEL: Record<ObjectNode['type'], string> = {
  plant: 'Завод',
  site: 'Площадка',
  workshop: 'Цех',
  section: 'Участок',
  equipment: 'Оборудование',
};

export type ObjectNodeItemProps = {
  node: ObjectNode;
  depth: number;
  expandedDefault?: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, selected: boolean) => void;
  onEquipmentClick: (node: ObjectNode) => void;
};

export function ObjectNodeItem({
  node,
  depth,
  expandedDefault = depth < 1,
  selectedIds,
  onToggleSelect,
  onEquipmentClick,
}: ObjectNodeItemProps) {
  const hasChildren = Boolean(node.children?.length);
  const [open, setOpen] = useState(expandedDefault);

  const handleRowClick = () => {
    if (node.type === 'equipment') {
      onEquipmentClick(node);
      return;
    }
    if (hasChildren) setOpen((v) => !v);
  };

  const paddingLeft = 1.5 + depth * 2;

  return (
    <Box>
      <ListItem
        disablePadding
        secondaryAction={
          hasChildren && node.type !== 'equipment' ? (
            <IconButton
              edge="end"
              size="small"
              aria-expanded={open}
              aria-label={open ? 'Свернуть' : 'Развернуть'}
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
            >
              {open ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </IconButton>
          ) : null
        }
      >
        <ListItemButton
          onClick={handleRowClick}
          sx={{ pl: paddingLeft, pr: 6, py: 0.75 }}
        >
          {node.type === 'equipment' ? (
            <ListItemIcon sx={{ minWidth: 42 }}>
              <Checkbox
                edge="start"
                checked={selectedIds.has(node.id)}
                tabIndex={-1}
                disableRipple
                onClick={(e) => e.stopPropagation()}
                onChange={(_, checked) => onToggleSelect(node.id, checked)}
              />
            </ListItemIcon>
          ) : (
            <Box sx={{ width: 42, flexShrink: 0 }} />
          )}
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography component="span" variant="body2" fontWeight={600}>
                  {node.name}
                </Typography>
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                  }}
                >
                  {TYPE_LABEL[node.type]}
                </Typography>
              </Box>
            }
          />
        </ListItemButton>
      </ListItem>

      {hasChildren ? (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding dense>
            {node.children!.map((ch) => (
              <ObjectNodeItem
                key={ch.id}
                node={ch}
                depth={depth + 1}
                expandedDefault={depth < 1}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
                onEquipmentClick={onEquipmentClick}
              />
            ))}
          </List>
        </Collapse>
      ) : null}
    </Box>
  );
}
