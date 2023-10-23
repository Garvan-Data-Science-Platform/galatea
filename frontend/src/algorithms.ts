interface AlgParam {
  name: string;
  type: "int" | "float";
  default: number;
  range?: number[];
  tooltip?: string;
}
interface Alg {
  name: string;
  id: string;
  params: AlgParam[];
}
interface Algorithms {
  global: Alg[];
  local: Alg[];
}
export const algorithms: Algorithms = {
  global: [
    {
      name: "None",
      id: "none",
      params: [],
    },
    {
      name: "Phase",
      id: "phase",
      params: [],
    },
  ],
  local: [
    {
      name: "None",
      id: "none",
      params: [],
    },
    {
      name: "Morphic",
      id: "morphic",
      params: [
        {
          name: "sigma_diff",
          type: "float",
          default: 20,
          tooltip: "The standard deviation for the difference calculation",
        },
        {
          name: "radius",
          type: "int",
          default: 15,
          tooltip: "The radius for the cross-correlation calculation",
        },
      ],
    },
    {
      name: "Optical Flow Polynomial Expansion",
      id: "optical_poly",
      params: [],
    },
    {
      name: "Optical Flow ILK",
      id: "optical_ILK",
      params: [],
    },
    {
      name: "Optical Flow TV-L1",
      id: "optical_TVL1",
      params: [],
    },
  ],
};
