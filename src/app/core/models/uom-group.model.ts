export interface UomGroupDetail {
  code: string;
  name: string;
  conversionFactor: number;
  isBaseUom: boolean;
  isDefaultForSales: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface UomGroup {
  id: string;
  name: string;
  baseUomCode: string;
  details: UomGroupDetail[];
  isActive: boolean;
  alias?: string;
}

export interface CreateUomGroupPayload {
  name: string;
  baseUomCode: string;
  details: UomGroupDetail[];
  isActive: boolean;
}
