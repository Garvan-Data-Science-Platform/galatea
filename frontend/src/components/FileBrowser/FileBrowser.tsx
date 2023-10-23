import classes from "./FileBrowser.module.scss";
import ListSubheader from "@mui/material/ListSubheader";
import List from "@mui/material/List";
import { Subdirectory, BucketFile } from "./Subdirectory";
import {
  CreateNewFolder,
  Delete,
  DeleteForever,
  UploadFile,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Popover,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";
import {
  createBucketFolder,
  deleteBucketFolder,
  getUploadURL,
} from "requests/bucket";
import { useAppDispatch, useAppSelector } from "state/hooks";
import {
  clearSelected,
  selectFileSelectionSelected,
} from "state/slices/fileSelectionSlice";
import auth0mockable from "../../auth0mockable";
import { convertPTFile } from "requests/flim";

interface FileBrowserProps {
  bucket: string;
  onClickFile?: (filepath: BucketFile, ls: string[]) => void;
  extensions?: string[];
  combine?: boolean;
}

function FileBrowser(props: FileBrowserProps) {
  const { getAccessTokenSilently } = auth0mockable.useAuth0();

  const [selectedFolder, setSelectedFolder] = React.useState("");
  const [newFolderName, setNewFolderName] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [reloader, setReloader] = React.useState(() => () => {});
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );
  const [delAnchorEl, setDelAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [key, setKey] = React.useState(1); //hack to reload entire tree

  const handleClickNewFolder = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClickDeleted = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDelAnchorEl(event.currentTarget);
  };
  const handleClosePopover = () => {
    setAnchorEl(null);
  };
  const handleCloseDelPopover = () => {
    setDelAnchorEl(null);
  };
  const handleUpload: React.ReactEventHandler<HTMLInputElement> = async (
    event
  ) => {
    const token = await getAccessTokenSilently();
    let file = event.target.files[0];
    let path =
      selectedFolder != "" ? selectedFolder + "/" + file.name : file.name;
    let url = await getUploadURL(token, "galatea", path);
    console.log("URL", url);
    let formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    await fetch(url, {
      method: "PUT",
      body: formData,
      headers: { "Content-Type": "application/octet-stream" },
    });
    if (["pt3", "npy", "ptu"].includes(file.name.slice(-3))) {
      await convertPTFile(token, path);
    }
    setUploading(false);
    reloader();
  };

  const selected = useAppSelector(selectFileSelectionSelected);
  const dispatch = useAppDispatch();

  const popoverOpen = Boolean(anchorEl);
  const delPopoverOpen = Boolean(delAnchorEl);

  const newFolder = async () => {
    let token = await getAccessTokenSilently();
    await createBucketFolder(
      token,
      "galatea",
      selectedFolder != ""
        ? selectedFolder + "/" + newFolderName
        : newFolderName
    );
    reloader();
  };

  const deleteSelected = async () => {
    let token = await getAccessTokenSilently();
    for (var i in selected) {
      await deleteBucketFolder(token, "galatea", selected[i]);
    }
    dispatch(clearSelected());
    setKey(Math.random()); //Reload tree
  };

  return (
    <List
      sx={{ bgcolor: "background.paper" }}
      className={classes.filebrowser}
      component="nav"
      aria-labelledby="nested-list-subheader"
      subheader={
        <ListSubheader component="div" id="nested-list-subheader">
          Select or upload a .pt3 or .ptu file
        </ListSubheader>
      }
    >
      {uploading ? (
        <Box>
          <CircularProgress />
        </Box>
      ) : null}

      <Tooltip title="Upload file">
        <IconButton component="label">
          <input
            type="file"
            accept=".ptu,.pt3"
            id="upload-input"
            hidden
            onChange={handleUpload}
          />
          <UploadFile data-cy="upload-button" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Create new folder">
        <IconButton onClick={handleClickNewFolder} data-cy="new-folder-button">
          <CreateNewFolder />
        </IconButton>
      </Tooltip>
      {selected.length > 0 ? (
        <Tooltip title="Delete selected">
          <IconButton onClick={handleClickDeleted} data-cy="delete-button">
            <DeleteForever />
          </IconButton>
        </Tooltip>
      ) : null}
      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 2, maxWidth: 200 }}>
          <TextField
            required
            id="standard-basic"
            label="New folder name"
            variant="standard"
            onChange={(e) => setNewFolderName(e.target.value)}
            data-cy="new-folder-text"
          />
          <Button
            onClick={() => {
              newFolder();
              handleClosePopover();
            }}
            data-cy="new-folder-create-button"
          >
            Create
          </Button>
        </Box>
      </Popover>
      <Popover
        open={delPopoverOpen}
        anchorEl={delAnchorEl}
        onClose={handleCloseDelPopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 2, maxWidth: 200, textAlign: "center" }}>
          <Typography>
            Are you sure you want to delete all selected files/folders?
          </Typography>
          <Button
            sx={{ marginTop: 2 }}
            color="error"
            variant="contained"
            onClick={() => {
              console.log("DELETING");
              deleteSelected();
              handleCloseDelPopover();
            }}
            data-cy="confirm-delete-button"
          >
            Delete
          </Button>
          <Button
            sx={{ marginTop: 2, marginLeft: 1 }}
            color="warning"
            variant="outlined"
            onClick={handleCloseDelPopover}
          >
            Cancel
          </Button>
        </Box>
      </Popover>
      <Subdirectory
        bucket={props.bucket}
        extensions={props.extensions}
        combine={props.combine}
        key={key}
        level={1}
        onClickFile={props.onClickFile}
        selectedFolder={selectedFolder}
        setSelectedFolder={(file, reload) => {
          setSelectedFolder(file);
          setReloader(() => reload);
        }}
      />
    </List>
  );
}

export default FileBrowser;
