import React from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Folder, InsertDriveFile } from "@mui/icons-material";
import { loadBucketDirectory } from "requests/bucket";
import { Alert, Checkbox } from "@mui/material";
import { useAppDispatch } from "state/hooks";
import { toggleSelected } from "state/slices/fileSelectionSlice";
import auth0mockable from "../../auth0mockable";
import classes from "./FileBrowser.module.scss";

interface DirectoryI {
  name: string;
  parent: string | undefined;
  level: number;
  open: boolean;
  subdirs: DirectoryI[];
  files: BucketFile[];
}

interface SubdirectoryProps {
  name?: string;
  bucket: string;
  parent?: string;
  level: number;
  onClickFile?: (file: BucketFile) => void;
  selectedFolder: string;
  setSelectedFolder: (file: string, load: () => Promise<void>) => void;
}

export interface BucketFile {
  name: string;
  url: string;
}

export function Subdirectory(props: SubdirectoryProps) {
  const { getAccessTokenSilently } = auth0mockable.useAuth0();
  const [subdirs, setSubdirs] = React.useState<DirectoryI[]>([]);
  const [files, setFiles] = React.useState<BucketFile[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");

  const dispatch = useAppDispatch();

  const folderString = props.parent
    ? props.parent + "/" + (props.name || "")
    : props.name || "";

  const handleClick = () => {
    setOpen(true);
    props.setSelectedFolder(folderString, load);
    if (!loaded) {
      load();
      return;
    }
  };

  const load = async () => {
    let token = await getAccessTokenSilently();

    var files, folders;
    try {
      [files, folders] = await loadBucketDirectory(token, {
        bucket: props.bucket,
        subdir: folderString,
        limit: 50,
      });
    } catch (e) {
      setAlertMessage(e);
      return;
    }

    let subdirs = folders.map((f: string): DirectoryI => {
      var parent = "";
      if (props.level == 2) {
        parent = props.name || "";
      }
      if (props.level > 2) {
        parent = props.parent + "/" + props.name;
      }

      f = f
        .split("/")
        .filter((v) => v !== "")
        .slice(-1)[0];

      return {
        name: f,
        parent: parent,
        level: props.level + 1,
        open: false,
        subdirs: [],
        files: [],
      };
    });
    setFiles(files);
    setSubdirs(subdirs);
    setOpen(true);
    setLoaded(true);
  };

  React.useEffect(() => {
    if (props.level == 1) {
      props.setSelectedFolder(folderString, load);
      load();
    }
  }, []);

  return (
    <div
      className={
        props.selectedFolder == folderString ? classes.selected : undefined
      }
      cy-selected={String(props.selectedFolder == folderString)}
    >
      {alertMessage != "" ? (
        <Alert
          severity="error"
          onClose={() => {
            setAlertMessage("");
          }}
        >
          {alertMessage}
        </Alert>
      ) : null}
      <ListItemButton
        onClick={handleClick}
        sx={{ pl: 2 * Math.max(props.level - 1, 1) }}
      >
        {props.level == 1 ? null : (
          <Checkbox
            onClick={(e) => {
              e.stopPropagation();
              dispatch(toggleSelected(folderString));
            }}
          />
        )}
        <ListItemIcon sx={{ minWidth: 34 }}>
          <Folder />
        </ListItemIcon>
        <ListItemText primary={props.name || props.bucket} />
        {open ? (
          <ExpandLess
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            data-cy="collapse"
          />
        ) : (
          <ExpandMore />
        )}
      </ListItemButton>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {subdirs.map((v): any => (
            <Subdirectory
              name={v.name}
              bucket={props.bucket}
              parent={v.parent}
              level={props.level + 1}
              key={`${v.parent}_${v.name}`}
              onClickFile={props.onClickFile}
              selectedFolder={props.selectedFolder}
              setSelectedFolder={props.setSelectedFolder}
            />
          ))}
          {files.map((v, idx) => (
            <ListItemButton
              sx={{ pl: 2 * props.level }}
              key={`${v}_${idx}`}
              onClick={() => (props.onClickFile ? props.onClickFile(v) : null)}
            >
              <Checkbox
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(toggleSelected(v.name));
                }}
              />
              <ListItemIcon sx={{ minWidth: 34 }}>
                <InsertDriveFile />
              </ListItemIcon>
              <ListItemText primary={v.name.split("/").slice(-1)} />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </div>
  ) as any;
}
