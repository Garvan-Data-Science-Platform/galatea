import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    imageTextBackground?: string;
  }
  // allow configuration using `createTheme`
  interface Palette {
    imageTextBackground?: string;
  }
}

const customTheme = createTheme({
  palette: {
    background: {
      paper: "#fff",
    },
    text: {
      primary: "#173A5E",
      secondary: "#46505A",
    },
    action: {
      active: "#001E3C",
    },
    primary: { main: "#173A5E" },
    imageTextBackground: "rgba(155, 162, 176, 0.829)",
  },
});

export default customTheme;
