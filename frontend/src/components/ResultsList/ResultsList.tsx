import classes from "./FileBrowser.module.scss";
import ListSubheader from "@mui/material/ListSubheader";
import List from "@mui/material/List";
import { Subdirectory, BucketFile } from "./Subdirectory";
import {
  CreateNewFolder,
  Delete,
  DeleteForever,
  InsertDriveFile,
  UploadFile,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
import { convertPTFile, getResults } from "requests/flim";
import {
  deselectResult,
  selectResults,
  selectSelectedResult,
  setResults,
  setSelectedResult,
} from "state/slices/resultsSlice";
import {
  selectChannel,
  selectCurrentImage,
  setChannel,
} from "state/slices/imageSlice";

interface FileBrowserProps {
  onClickFile?: (filepath: BucketFile, ls: string[]) => void;
}

function FileBrowser(props: FileBrowserProps) {
  const { getAccessTokenSilently } = auth0mockable.useAuth0();

  const [uploading, setUploading] = React.useState(false);

  const currentImage = useAppSelector(selectCurrentImage);

  const selected = useAppSelector(selectSelectedResult);
  const results = useAppSelector(selectResults);
  const channel = useAppSelector(selectChannel);
  const dispatch = useAppDispatch();

  async function loadResults() {
    let token = await getAccessTokenSilently();
    let results = await getResults(token, currentImage || "");
    console.log("RESULTS", results);
    dispatch(setResults(results));
  }

  React.useEffect(() => {
    if (currentImage) {
      loadResults();
    }
  }, [currentImage]);

  const filtered = results.filter((v) => v.task_id == selected);

  React.useEffect(() => {
    console.log("DESELECTING");
    if (selected && filtered.length > 0 && channel != filtered[0].channel) {
      dispatch(deselectResult());
    }
  }, [channel]);

  React.useEffect(() => {
    dispatch(deselectResult());
  }, [currentImage]);

  React.useEffect(() => {
    if (selected && filtered.length > 0) {
      dispatch(setChannel(filtered[0].channel));
    }
  }, [selected]);

  return (
    <List
      sx={{ bgcolor: "background.paper" }}
      className={classes.filebrowser}
      component="nav"
      aria-labelledby="nested-list-subheader"
      subheader={
        <ListSubheader component="div" id="nested-list-subheader">
          Results
        </ListSubheader>
      }
    >
      {uploading ? (
        <Box>
          <CircularProgress />
        </Box>
      ) : null}
      {results.map((val, idx) => {
        return (
          <ListItemButton
            onClick={() => {
              dispatch(setSelectedResult(val.task_id));
            }}
            key={"RESULT_" + idx}
          >
            <ListItemIcon sx={{ minWidth: 34 }}>
              <InsertDriveFile />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{
                fontWeight: selected == val.task_id ? "bold" : undefined,
              }}
              primary={
                `${new Date(val.timestamp).toLocaleString("en-AU", {
                  timeZone: "Australia/Melbourne",
                })}` +
                " CH" +
                (val.channel + 1) +
                (val.global_algorithm
                  ? " Global: " +
                    val.global_algorithm +
                    String(val.global_params || "")
                  : " Global: None") +
                (val.local_algorithm
                  ? " Local: " +
                    val.local_algorithm +
                    " " +
                    Object.keys(val.local_params)
                      .map((key) => `${key}=${val.local_params[key]}`)
                      .join(" ")
                  : " Local: None")
              }
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}

export default FileBrowser;
