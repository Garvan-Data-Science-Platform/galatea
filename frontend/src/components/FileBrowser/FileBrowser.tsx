import classes from "./FileBrowser.module.scss";
import ListSubheader from "@mui/material/ListSubheader";
import List from "@mui/material/List";
import { useAuth0 } from "@auth0/auth0-react";
import { Subdirectory, BucketFile } from "./Subdirectory";

interface FileBrowserProps {
  bucket: string;
  onSelectFile: (filepath: BucketFile) => void;
}

function FileBrowser(props: FileBrowserProps) {
  const { isAuthenticated } = useAuth0();

  if (!isAuthenticated) {
    return <p>Not logged in.</p>;
  }
  return (
    <List
      sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
      className={classes.filebrowser}
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
        onSelectFile={props.onSelectFile}
      />
    </List>
  );
}

export default FileBrowser;
