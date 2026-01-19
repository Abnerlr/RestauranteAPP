export class SessionResponseDto {
  id: string;
  tableId: string;
  table: {
    id: string;
    number: number;
    area: string | null;
    status: string;
  };
  openedByUserId: string;
  status: string;
  openedAt: Date;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
