import fileSelectionReducer, {
  fileSelectionState,
  toggleSelected,
  clearSelected,
} from "./fileSelectionSlice";

describe("counter reducer", () => {
  const initialState: fileSelectionState = {
    selected: [],
  };
  it("should handle initial state", () => {
    expect(fileSelectionReducer(undefined, { type: "unknown" })).toEqual({
      selected: [],
    });
  });

  it("should handle adding new file with toggle", () => {
    const actual = fileSelectionReducer(initialState, toggleSelected("file/1"));
    expect(actual.selected).toEqual(["file/1"]);
  });

  it("should add new file on toggle if not there", () => {
    const s1 = fileSelectionReducer(initialState, toggleSelected("file/1"));
    const s2 = fileSelectionReducer(s1, toggleSelected("file/2"));
    expect(s2.selected).toEqual(["file/1", "file/2"]);
  });

  it("should remove file on toggle if already in list", () => {
    const s1 = fileSelectionReducer(initialState, toggleSelected("file/1"));
    const s2 = fileSelectionReducer(s1, toggleSelected("file/2"));
    const s3 = fileSelectionReducer(s2, toggleSelected("file/1"));
    expect(s3.selected).toEqual(["file/2"]);
  });

  it("should clear selected", () => {
    const s1 = fileSelectionReducer(initialState, toggleSelected("file/1"));
    const s2 = fileSelectionReducer(s1, toggleSelected("file/2"));
    const s3 = fileSelectionReducer(s2, toggleSelected("file/1"));
    const s4 = fileSelectionReducer(s3, clearSelected());
    expect(s4.selected).toEqual([]);
  });
});
