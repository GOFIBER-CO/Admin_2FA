import React, { useState, useEffect } from "react";
import { Col, Container, Row } from "reactstrap";
import BreadCrumb from "../../common/BreadCrumb";
import {
  message,
  Input,
  Button,
  Form,
  Space,
  Tooltip,
  Table,
  Drawer,
  Upload,
  Modal,
  Image,
} from "antd";

import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  deleteApp,
  getAllApp,
  insertApp,
  updateApp,
} from "../../helpers/helper";
import moment from "moment";
import { deleteImageBunny, uploadFileToBunny } from "../../helpers/api_bunny";
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result);

    reader.onerror = (error) => reject(error);
  });
function convertToSlug(Text) {
  return Text.toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}
const Apps = () => {
  document.title = "Management Apps";

  const [form] = Form.useForm();
  const [formSearch] = Form.useForm();
  const [listShortCode, setShortCode] = useState([]);
  const [isShow, setIsShow] = useState(true);
  const [visibleForm, setVisibleForm] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState("");
  const [listApp, setApp] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  // -- Load data
  useEffect(() => {
    async function fetchData() {
      const dataRes = await getAllData();
      setApp(dataRes);
    }
    fetchData();
  }, []);
  const handleCancel = () => setPreviewVisible(false);
  //xu ly upload image
  const handleChangeImage = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };
  //end

  //prop upload component
  const propsUpload = {
    onRemove: async (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
      const resDelete = await deleteImageBunny(file.name);
      if (resDelete.HttpCode === 200) {
        message.success("Delete file to Bunny successfully!");
      } else {
        message.error("Delete file to Bunny failed!");
      }
    },
    beforeUpload: async (file) => {
      setFileList([file]);
      const resUpload = await uploadFileToBunny(file);
      if (resUpload.HttpCode === 201) {
        message.success("Upload file to Bunny successfully!");
        setPreviewImage("https://bongdathethao.b-cdn.net/" + file.name);
        setPreviewTitle(file.name);
        return false;
      } else {
        message.error("Upload file to Bunny failed!");
        deleteImageBunny(file.name);
        setPreviewImage("");
        setFileList([]);
        return false;
      }
    },
  };
  //end
  //xu ly preview image
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
    setPreviewTitle(
      file.name || file.url.substring(file.url.lastIndexOf("/") + 1)
    );
  };
  //end

  const getAllData = async (_prams) => {
    const params = _prams
      ? _prams
      : {
          pageIndex: 1,
          pageSize: 100000,
          search: "",
        };
    const dataRes = await getAllApp(params);
    const data =
      dataRes?.data &&
      dataRes?.data.length > 0 &&
      dataRes?.data.map((item) => {
        return {
          key: item._id,
          name: item.appName,
          icon: item.appIcon,
          content: item.content,
          status: item?.isShow,
          createdTime: moment(new Date(item.createdTime)).format("DD/MM/YYYY"),
        };
      });
    return dataRes?.data ? data : [];
  };

  const onFinish = async (data) => {
    const dataReq = {
      appName: data.name,
      appSlug: convertToSlug(data.name),
      appIcon: previewTitle,
      content: data.content,
      isShow: isShow,
    };

    if (!data.id) {
      //Save
      const dataRes = await insertApp(dataReq);
      dataRes.status === 1
        ? message.success(`Save Success! ${dataRes.message}`)
        : message.error(`Save Failed! ${dataRes.message}`);
    } else {
      //Update
      const dataRes = await updateApp(data.id, dataReq);
      dataRes.status === 1
        ? message.success(`Update Success! ${dataRes.message}`)
        : message.error(`Update Failed! ${dataRes.message}`);
    }
    //
    handleCloseDrawer();
    form.resetFields();
    setIsShow(false);
    //
    const dataRes = await getAllData();
    setApp(dataRes);
  };

  const handleSearch = async () => {
    const dataForm = formSearch.getFieldsValue();
    console.log(dataForm.name);
    const params = {
      pageIndex: 1,
      pageSize: 10,
      search: dataForm.name ? dataForm.name : "",
    };
    const dataRes = await getAllData(params);
    setApp(dataRes);
  };

  const onEdit = (key) => {
    const dataEdit = listApp.filter((item) => item.key === key);
    //
    setIsShow(dataEdit[0].status);
    //
    form.setFieldsValue({
      id: dataEdit[0].key,
      name: dataEdit[0].name,
      icon: dataEdit[0].icon,
      content: dataEdit[0].content,
      status: dataEdit[0].status,
    });
    setFileList([
      {
        url: `https://bongdathethao.b-cdn.net/${dataEdit[0].icon}`,
        name: dataEdit[0].icon,
      },
    ]);
    setPreviewImage(`https://bongdathethao.b-cdn.net/${dataEdit[0].icon}`);
    setPreviewTitle(dataEdit[0].icon);
    setDrawerTitle("Edit App");
    showDrawer();
  };

  const onDelete = async (key) => {
    const dataRes = await deleteApp(key);
    dataRes.status === 1
      ? message.success(`Delete Success! ${dataRes.message}`)
      : message.error(`Delete Failed! ${dataRes.message}`);
    //
    handleRefresh();
  };

  const handleRefresh = async () => {
    form.resetFields();
    formSearch.resetFields();
    const dataRes = await getAllData();
    setIsShow(false);
    setApp(dataRes);
  };

  const handleChange = () => {
    setIsShow(!isShow);
  };

  // Filed
  const columns = [
    {
      title: "App Name",
      dataIndex: "name",
    },
    {
      title: "App Icon",
      dataIndex: "icon",
      render: (_) => {
        return (
          <Image
            src={`https://bongdathethao.b-cdn.net/${_}`}
            height={60}
            width={60}
          />
        );
      },
    },
    {
      title: "App Content",
      dataIndex: "content",
    },
    {
      title: "Created Time",
      dataIndex: "createdTime",
    },
    {
      title: "Action",
      dataIndex: "",
      render: (_, record) =>
        listApp.length >= 1 ? (
          <Space>
            <Tooltip title="Edit">
              <Button
                type="primary"
                shape="circle"
                icon={<EditOutlined />}
                size="small"
                onClick={() => onEdit(record.key)}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="danger"
                shape="circle"
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => onDelete(record.key)}
              />
            </Tooltip>
          </Space>
        ) : null,
    },
  ];

  const onClose = () => {
    setVisibleForm(false);
    setFileList([]);
    setPreviewImage("");
    setPreviewTitle("");
  };
  const showDrawer = () => {
    setVisibleForm(true);
  };
  const handleNewShortCode = () => {
    setDrawerTitle("Add App");
    showDrawer();
    form.resetFields();
  };
  const handleCloseDrawer = () => {
    setDrawerTitle("");
    setVisibleForm(false);
    form.resetFields();
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="App" pageTitle="Management App" />
          <Form
            form={formSearch}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Row>
              <Col hidden={true}>
                <Form.Item name="id" label="Id">
                  <Input name="id" />
                </Form.Item>
              </Col>
              <Col sm={3}>
                <Form.Item
                  name="name"
                  label="Search app by name:"
                  rules={[
                    {
                      required: false,
                      message: "Please input name!",
                    },
                    {
                      type: "Name",
                    },
                    {
                      type: "string",
                      min: 1,
                    },
                  ]}
                >
                  <Input
                    placeholder="Enter name!"
                    name="Name"
                    allowClear={true}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item className="mt-3">
              <Space>
                <Button
                  type="primary"
                  htmlType="button"
                  onClick={() => handleSearch()}
                >
                  Search
                </Button>
                <Button type="primary" onClick={handleNewShortCode}>
                  Create
                </Button>
                <Button
                  type="primary"
                  htmlType="button"
                  onClick={() => handleRefresh()}
                >
                  Refresh
                </Button>
              </Space>
            </Form.Item>
          </Form>
          <div>
            <Col xs={12}>
              <Drawer
                title={drawerTitle}
                placement={"right"}
                width={"30%"}
                onClose={onClose}
                open={visibleForm}
                bodyStyle={{
                  paddingBottom: 80,
                }}
                style={{ marginTop: "70px" }}
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  autoComplete="off"
                >
                  <Row>
                    <Col hidden={true}>
                      <Form.Item name="id" label="Id">
                        <Input name="id" />
                      </Form.Item>
                    </Col>
                    <Form.Item
                      name="name"
                      label="Name"
                      rules={[
                        {
                          required: true,
                          message: "Please input name!",
                        },
                        {
                          type: "Name",
                        },
                        {
                          type: "string",
                          min: 1,
                        },
                      ]}
                    >
                      <Input
                        placeholder="Enter name!"
                        name="Name"
                        allowClear={true}
                      />
                    </Form.Item>
                    <Form.Item
                      name="content"
                      label="Content"
                      rules={[
                        {
                          required: true,
                          message: "Please input content!",
                        },
                        {
                          type: "content",
                        },
                        {
                          type: "string",
                          min: 1,
                        },
                      ]}
                    >
                      <Input
                        placeholder="Enter content!"
                        name="content"
                        allowClear={true}
                      />
                    </Form.Item>
                    <Form.Item
                      name="icon"
                      label="Icon App"
                      className=""
                      rules={[
                        {
                          required: false,
                          message: "Please select icon app!",
                        },
                      ]}
                    >
                      <Space align="start">
                        <Upload
                          {...propsUpload}
                          listType="picture-card"
                          fileList={fileList}
                          onChange={handleChangeImage}
                          onPreview={handlePreview}
                        >
                          {fileList.length >= 1 ? null : (
                            <div>
                              <PlusOutlined />
                              <div
                                style={{
                                  marginTop: 8,
                                }}
                              >
                                Upload
                              </div>
                            </div>
                          )}
                        </Upload>
                        {previewImage && (
                          <>
                            <Modal
                              visible={previewVisible}
                              title={previewTitle}
                              footer={null}
                              onCancel={handleCancel}
                            >
                              <img
                                alt={previewTitle}
                                style={{ width: "100%" }}
                                src={previewImage}
                              />
                            </Modal>
                          </>
                        )}
                      </Space>
                    </Form.Item>
                    <Form.Item
                      name="status"
                      label="Status"
                      rules={[
                        {
                          required: false,
                          message: "Please status!",
                        },
                        {
                          type: "status",
                        },
                      ]}
                      className="item-checkbox"
                    >
                      <Input
                        type="checkbox"
                        checked={isShow}
                        onChange={handleChange}
                        allowClear={true}
                        style={{ border: "aliceblue" }}
                      />
                    </Form.Item>
                  </Row>
                  <Form.Item className="mt-3">
                    <Space>
                      <Button type="primary" htmlType="submit">
                        Save
                      </Button>
                      <Button
                        type="primary"
                        htmlType="button"
                        onClick={() => handleRefresh()}
                      >
                        Refresh
                      </Button>
                      <Button type="danger" onClick={handleCloseDrawer}>
                        Close
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Drawer>
            </Col>
          </div>
          <div>
            <Table columns={columns} dataSource={listApp} />
          </div>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Apps;
