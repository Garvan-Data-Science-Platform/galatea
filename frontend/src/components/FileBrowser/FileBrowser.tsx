import "./FileBrowser.scss";
import ListSubheader from "@mui/material/ListSubheader";
import List from "@mui/material/List";
import { useAuth0 } from "@auth0/auth0-react";
import { Subdirectory, BucketFile } from "./Subdirectory";

interface FileBrowserProps {
  bucket: string;
  onSelectFile: (filepath: string) => void;
}

function FileBrowser(props: FileBrowserProps) {
  const { isAuthenticated } = useAuth0();

  const onSelectFile = (file: BucketFile) => {
    console.log("SELECTED", file);
  };

  if (!isAuthenticated) {
    return <p>Not logged in.</p>;
  }
  return (
    <List
      sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
      component="nav"
      aria-labelledby="nested-list-subheader"
      subheader={
        <ListSubheader component="div" id="nested-list-subheader">
          Bucket file browser
        </ListSubheader>
      }
    >
      <Subdirectory
        bucket={props.bucket}
        level={1}
        onSelectFile={onSelectFile}
      />
    </List>
  );
}

export default FileBrowser;
