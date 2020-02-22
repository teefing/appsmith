import * as React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import Uppy from "@uppy/core";
import GoogleDrive from "@uppy/google-drive";
import Webcam from "@uppy/webcam";
import Url from "@uppy/url";
import OneDrive from "@uppy/onedrive";
import FilePickerComponent from "components/designSystems/appsmith/FilePickerComponent";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { EventType } from "constants/ActionConstants";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import Dashboard from "@uppy/dashboard";

class FilePickerWidget extends BaseWidget<FilePickerWidgetProps, WidgetState> {
  uppy: any;

  constructor(props: FilePickerWidgetProps) {
    super(props);
    this.refreshUppy(props);
  }

  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      label: VALIDATION_TYPES.TEXT,
      maxNumFiles: VALIDATION_TYPES.NUMBER,
      allowedFileTypes: VALIDATION_TYPES.ARRAY,
    };
  }

  refreshUppy = (props: FilePickerWidgetProps) => {
    this.uppy = Uppy({
      id: this.props.widgetId,
      autoProceed: false,
      allowMultipleUploads: true,
      debug: false,
      restrictions: {
        maxFileSize: null,
        maxNumberOfFiles: props.maxNumFiles,
        minNumberOfFiles: null,
        allowedFileTypes: props.allowedFileTypes,
      },
    })
      .use(Dashboard, {
        target: "body",
        metaFields: [],
        inline: false,
        width: 750,
        height: 550,
        thumbnailWidth: 280,
        showLinkToFileUploadResult: true,
        showProgressDetails: false,
        hideUploadButton: false,
        hideProgressAfterFinish: false,
        note: null,
        closeModalOnClickOutside: true,
        disableStatusBar: false,
        disableInformer: false,
        disableThumbnailGenerator: false,
        disablePageScrollWhenModalOpen: true,
        proudlyDisplayPoweredByUppy: false,
        onRequestCloseModal: () => {
          this.uppy.getPlugin("Dashboard").closeModal();
        },
        locale: {},
      })
      .use(GoogleDrive, { companionUrl: "https://companion.uppy.io" })
      .use(Url, { companionUrl: "https://companion.uppy.io" })
      .use(OneDrive, {
        companionUrl: "https://companion.uppy.io/",
      })
      .use(Webcam, {
        onBeforeSnapshot: () => Promise.resolve(),
        countdown: false,
        mirror: true,
        facingMode: "user",
        locale: {},
      });
    this.uppy.on("file-added", (file: any) => {
      this.updateWidgetMetaProperty("file", file);
    });
    this.uppy.on("upload", () => {
      const files = this.uppy.getFiles();
      const fileArray: any = [];
      if (files.length === 0) {
        this.updateWidgetMetaProperty("files", []);
      } else {
        files.map((file: any) => {
          const reader = new FileReader();
          reader.readAsDataURL(file.data);
          reader.onloadend = () => {
            const base64data = reader.result;
            fileArray.push(base64data);
            if (fileArray.length === files.length) {
              this.uppy.getPlugin("Dashboard").closeModal();
              this.updateWidgetMetaProperty("files", fileArray);
              this.onFilesSelected();
            }
          };
        });
      }
      return true;
    });
  };

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onFilesSelected: true,
    };
  }

  onFilesSelected() {
    if (this.props.onFilesSelected) {
      this.executeAction({
        dynamicString: this.props.onFilesSelected,
        event: {
          type: EventType.ON_FILES_SELECTED,
        },
      });
    }
  }

  componentDidUpdate(prevProps: FilePickerWidgetProps) {
    super.componentDidUpdate(prevProps);
    if (
      prevProps.allowedFileTypes !== this.props.allowedFileTypes ||
      prevProps.maxNumFiles !== this.props.maxNumFiles
    ) {
      this.refreshUppy(this.props);
    }
  }

  componentDidMount() {
    super.componentDidMount();
    this.refreshUppy(this.props);
  }

  componentWillUnmount() {
    this.uppy.close();
  }

  getPageView() {
    return (
      <FilePickerComponent
        uppy={this.uppy}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        label={this.props.label}
        files={this.props.files}
        isLoading={this.props.isLoading}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "FILE_PICKER_WIDGET";
  }
}

export interface FilePickerWidgetProps extends WidgetProps {
  label: string;
  maxNumFiles?: number;
  files: any[];
  allowedFileTypes: string[];
  onFilesSelected?: string;
}

export default FilePickerWidget;
