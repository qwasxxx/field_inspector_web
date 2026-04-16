import { Card, CardContent, Typography } from '@mui/material';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import type { Equipment } from '@/entities/equipment/model/types';

type Props = {
  equipment: Equipment;
};

export function EquipmentCard({ equipment }: Props) {
  return (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
      <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <PrecisionManufacturingOutlinedIcon
          color="primary"
          sx={{ fontSize: 36, mt: 0.5 }}
        />
        <div>
          <Typography variant="subtitle1" fontWeight={600}>
            {equipment.name}
          </Typography>
          {equipment.designation ? (
            <Typography variant="body2" color="text.secondary">
              {equipment.designation}
            </Typography>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
