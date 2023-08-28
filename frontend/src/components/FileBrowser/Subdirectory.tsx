import React from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useAuth0 } from "@auth0/auth0-react";
import { Folder, InsertDriveFile } from "@mui/icons-material";
import { loadBucketDirectory } from "requests/bucket";

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
  onSelectFile: (file: BucketFile) => void;
}

export interface BucketFile {
  name: string;
  url: string;
}

export function Subdirectory(props: SubdirectoryProps) {
  const { getAccessTokenSilently } = useAuth0();
  const [subdirs, setSubdirs] = React.useState<DirectoryI[]>([]);
  const [files, setFiles] = React.useState<BucketFile[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const handleClick = () => {
    if (!loaded) {
      load();
      return;
    }
    setOpen(!open);
  };

  const load = async () => {
    let token = await getAccessTokenSilently();

    var subdir;

    if (props.level > 1) {
      if (props.level == 2) {
        subdir = props.name || "";
      } else {
        subdir = props.parent + "/" + (props.name || "");
      }
    }
    var files, folders;
    try {
      [files, folders] = await loadBucketDirectory(token, {
        bucket: props.bucket,
        subdir: subdir,
        limit: 50,
      });
    } catch (e) {
      alert(e);
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

  return (
    <>
      <ListItemButton onClick={handleClick} sx={{ pl: 2 * props.level }}>
        <ListItemIcon>
          <Folder />
        </ListItemIcon>
        <ListItemText primary={props.name || props.bucket} />
        {open ? <ExpandLess /> : <ExpandMore />}
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
              onSelectFile={props.onSelectFile}
            />
          ))}
          {files.map((v, idx) => (
            <ListItemButton
              sx={{ pl: 2 * (props.level + 1) }}
              key={`${v}_${idx}`}
              onClick={() => props.onSelectFile(v)}
            >
              <ListItemIcon>
                <InsertDriveFile />
              </ListItemIcon>
              <ListItemText primary={v.name.split("/").slice(-1)} />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </>
  ) as any;
}
