import { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as bootstrap from "bootstrap";
import "./assets/style.css";

const { VITE_BASE_URL, VITE_API_PATH } = import.meta.env;
const PRODUCT_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: 1,
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [isLogin, setIsLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [primaryImage, setPrimaryImage] = useState(null);
  const [loginErrMessage, setLoginErrMessage] = useState(null);
  const [isCheckedAuth, setIsCheckedAuth] = useState(false);
  const [tempProductData, setTempProductData] = useState(PRODUCT_DATA);
  const [modalType, setModalType] = useState("");
  const [showMessages, setShowMessages] = useState({ type: "", msgs: [] });

  const productModalRef = useRef(null);
  const delProductModalRef = useRef(null);
  const viewProductModalRef = useRef(null);
  const inputImageUrlRef = useRef(null);
  const msgToastRef = useRef(null);

  const getToken = () => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1];

    return token;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${VITE_BASE_URL}/admin/signin`,
        formData
      );

      setIsLogin(response.data.success);
      setLoginErrMessage(!response.data.success ? response.data.message : null);
      if (response.data.success) {
        const { token, expired } = response.data;
        document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
        getProducts(token);
      }
    } catch (error) {
      setIsLogin(false);
      setLoginErrMessage(error.response?.data);
      console.log(error.response);
    }
  };

  const handleInputChange = (e, formName) => {
    const { name, value, type, checked } = e.target;
    if (formName === "loginForm") {
      setFormData((preData) => ({
        ...preData,
        [name]: value,
      }));
    } else {
      setTempProductData((preData) => ({
        ...preData,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleAddImage = () => {
    const url = inputImageUrlRef.current.value;
    if (!url) return;

    if (tempProductData.imageUrl) {
      setTempProductData((preData) => ({
        ...preData,
        imagesUrl: [...preData.imagesUrl, url],
      }));
    } else {
      setTempProductData((preData) => ({
        ...preData,
        imageUrl: url,
      }));
    }

    inputImageUrlRef.current.value = "";
  };

  const handleRemoveImage = (url) => {
    const index = tempProductData.imagesUrl.findIndex((item) => item === url);

    setTempProductData((preData) => {
      const newImages = [...preData.imagesUrl];
      newImages.splice(index, 1);
      return { ...preData, imagesUrl: newImages };
    });

    inputImageUrlRef.current.value = "";
  };

  const handleChangeMainImage = (url) => {
    const newMainImageIndex = tempProductData.imagesUrl.findIndex(
      (item) => item === url
    );
    const oldMainImage = tempProductData.imageUrl;

    setTempProductData((preData) => {
      const newImages = [...preData.imagesUrl];
      newImages.splice(newMainImageIndex, 1);
      newImages.push(oldMainImage);
      return { ...preData, imagesUrl: newImages, imageUrl: url };
    });

    inputImageUrlRef.current.value = "";
  };

  const checkLogin = async (token) => {
    try {
      const config = {
        headers: { Authorization: token },
      };

      const checkRes = await axios.post(
        `${VITE_BASE_URL}/api/user/check`,
        {},
        config
      );

      setIsLogin(checkRes.data.success);
      setLoginErrMessage(!checkRes.data.success ? checkRes.data.message : null);

      if (checkRes.data.success) {
        getProducts(token);
      }
    } catch (error) {
      setIsLogin(false);
      setLoginErrMessage(error.response?.data);
    } finally {
      setIsCheckedAuth(true);
      viewProductModalRef.current = new bootstrap.Modal("#viewProductModal");
      delProductModalRef.current = new bootstrap.Modal("#delProductModal");
    }
  };

  const updateProduct = async (id) => {
    let url = `${VITE_BASE_URL}/api/${VITE_API_PATH}/admin/product`;
    let method = "post";

    const token = getToken();

    if (modalType === "edit") {
      url = `${VITE_BASE_URL}/api/${VITE_API_PATH}/admin/product/${id}`;
      method = "put";
    }

    const productData = {
      ...tempProductData,
      origin_price: parseInt(tempProductData.origin_price),
      price: parseInt(tempProductData.price),
      is_enabled: parseInt(tempProductData.is_enabled),
    };

    try {
      const response = await axios[method](
        url,
        { data: productData },
        {
          headers: { Authorization: token },
        }
      );

      if (response.data.success) {
        closeProductModal();
        getProducts(token);
        setShowMessages({
          type: "success",
          msgs: [`產品${modalType === "edit" ? "更新" : "新增"}成功`],
        });
      } else {
        setShowMessages({ type: "error", msgs: [...response.data.message] });
      }
      msgToastRef.current.show();
    } catch (error) {
      console.error("更新失敗：", error.response?.data);
    }
  };

  const deleteProduct = async (id) => {
    const url = `${VITE_BASE_URL}/api/${VITE_API_PATH}/admin/product/${id}`;
    const token = getToken();

    try {
      const response = await axios.delete(url, {
        headers: { Authorization: token },
      });

      if (response.data.success) {
        closeDelProductModal();
        getProducts(token);
        setShowMessages({
          type: "success",
          msgs: [`產品刪除成功`],
        });
      } else {
        setShowMessages({ type: "error", msgs: [response.data.message] });
      }
      msgToastRef.current.show();
    } catch (error) {
      console.error("更新失敗：", error.response?.data);
    }
  };

  const logout = () => {
    document.cookie =
      "hexToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsLogin(false);
  };

  const getProducts = async (token) => {
    try {
      const response = await axios.get(
        `${VITE_BASE_URL}/api/${VITE_API_PATH}/admin/products`,
        { headers: { Authorization: token } }
      );
      setProducts(response.data.products);
    } catch (error) {
      console.error(error.response?.data);
    }
  };

  const openProductModal = (product, modelType) => {
    if (product.imagesUrl === undefined) product.imagesUrl = [];

    setTempProductData({
      ...product,
      imagesUrl: [...product.imagesUrl],
    });
    // setTempProductData(product);
    setModalType(modelType);
    productModalRef.current.show();
  };

  const closeProductModal = () => {
    productModalRef.current.hide();
  };

  const openViewProductModal = (e, product) => {
    e.preventDefault();
    setPrimaryImage(product.imageUrl);

    if (product.imagesUrl === undefined) product.imagesUrl = [];

    setTempProductData({
      ...product,
      imagesUrl: [...product.imagesUrl],
    });
    viewProductModalRef.current.show();
  };

  const openDelProductModal = (product) => {
    if (product.imagesUrl === undefined) product.imagesUrl = [];
    setTempProductData({
      ...product,
      imagesUrl: [...product.imagesUrl],
    });
    delProductModalRef.current.show();
  };

  const closeDelProductModal = () => {
    delProductModalRef.current.hide();
  };

  useEffect(() => {
    productModalRef.current = new bootstrap.Modal("#productModal", {
      keyboard: false,
    });

    msgToastRef.current = new bootstrap.Toast("#msgToast");

    // Modal 關閉時移除焦點
    document
      .querySelector("#productModal")
      .addEventListener("hide.bs.modal", () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      });

    const token = getToken();

    if (token) checkLogin(token);
    else setIsCheckedAuth(true);
  }, []);

  return (
    <>
      {isCheckedAuth ? (
        <div>
          {isLogin ? (
            <div>
              <div className="container">
                <div className="row">
                  <div className="col-6">
                    <div className="text-start mt-4">
                      <button
                        className="btn btn-danger mb-5"
                        type="button"
                        onClick={logout}
                      >
                        管理員登出
                      </button>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-end mt-4">
                      <button
                        className="btn btn-primary"
                        onClick={() => openProductModal(PRODUCT_DATA, "create")}
                      >
                        建立新的產品
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border rounded">
                  <table className="table mt-4 table-striped ">
                    <thead>
                      <tr>
                        <th className="text-start">產品名稱</th>
                        <th>分類</th>
                        <th width="120" className="text-end">
                          原價
                        </th>
                        <th width="120" className="text-end">
                          售價
                        </th>
                        <th>是否啟用</th>
                        <th width="120">編輯</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td className="text-start">
                            <a
                              href="#"
                              className="text-decoration-none"
                              onClick={(e) => openViewProductModal(e, product)}
                            >
                              {product.title}
                            </a>
                          </td>
                          <td>{product.category}</td>
                          <td className="text-end">{product.origin_price}</td>
                          <td className="text-end">{product.price}</td>
                          <td>
                            {product.is_enabled === 1 ? (
                              <span className="text-success">啟用</span>
                            ) : (
                              <span>未啟用</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                type="button"
                                onClick={() =>
                                  openProductModal(product, "edit")
                                }
                                className="btn btn-outline-primary btn-sm"
                              >
                                編輯
                              </button>
                              <button
                                type="button"
                                onClick={() => openDelProductModal(product)}
                                className="btn btn-outline-danger btn-sm"
                              >
                                刪除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="container login">
              <div className="row justify-content-center">
                <h1 className="h3 mb-3 font-weight-normal">請先登入</h1>
                <div className="col-8">
                  <form
                    id="form"
                    className="form-signin"
                    onSubmit={(e) => handleSubmit(e)}
                  >
                    <div className="form-floating mb-3">
                      <input
                        type="email"
                        className="form-control"
                        name="username"
                        placeholder="name@example.com"
                        onChange={(e) => handleInputChange(e, "loginForm")}
                        required
                        autoFocus
                      />
                      <label htmlFor="username">Email address</label>
                    </div>
                    <div className="form-floating">
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        placeholder="Password"
                        onChange={(e) => handleInputChange(e, "loginForm")}
                        required
                      />
                      <label htmlFor="password">Password</label>
                    </div>
                    <button
                      className="btn btn-lg btn-primary w-100 mt-3"
                      type="submit"
                    >
                      登入
                    </button>
                  </form>
                  {loginErrMessage ? (
                    <p className="text-danger">
                      {loginErrMessage}，您的帳號或密碼錯誤!
                    </p>
                  ) : (
                    ""
                  )}
                </div>
              </div>
              <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
            </div>
          )}
        </div>
      ) : (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "600px" }}
        >
          <div className="d-flex justify-content-center">
            <span
              className="spinner-border spinner-border-sm me-1"
              aria-hidden="true"
            ></span>
            <span role="status">Loading...</span>
          </div>
        </div>
      )}
      <div
        className="modal fade"
        id="viewProductModal"
        ref={viewProductModalRef}
        data-bs-backdrop="static"
        tabIndex="-1"
        aria-labelledby="viewProductModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h1 className="modal-title fs-5" id="viewProductModalLabel">
                {tempProductData
                  ? `產品細節-${tempProductData.title}`
                  : `請選擇一個商品查看`}
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-1 d-flex justify-content-between">
                <div>
                  <h5 className="text-start">
                    <span className="badge fs-6 bg-primary ms-2 me-2">
                      {tempProductData.category}
                    </span>
                    {tempProductData.title}
                  </h5>
                </div>
                <div className="fs-5">
                  <span className="text-secondary">
                    <del>{tempProductData.origin_price}</del>
                  </span>
                  元 /{" "}
                  <span className="text-danger"> {tempProductData.price} </span>
                  元
                </div>
              </div>

              <div>
                {tempProductData ? (
                  <div className="pb-1 pt-1 border-top">
                    {primaryImage && (
                      <img
                        src={primaryImage}
                        className="card-img-top primary-image"
                        alt="主圖"
                      />
                    )}

                    <div className="d-flex flex-wrap justify-content-center">
                      {tempProductData.imagesUrl.map((photo, index) => (
                        <div className="m-1" key={`photo_${index}`}>
                          <img
                            onClick={() => setPrimaryImage(photo)}
                            src={photo}
                            className="card-img-top images rounded border p-1"
                            alt="其他圖片"
                          />{" "}
                        </div>
                      ))}
                    </div>
                    <div className="text-start m-3">
                      <p>商品描述：{tempProductData.description}</p>
                      <p>商品內容：{tempProductData.content}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-secondary">請選擇一個商品查看</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        id="productModal"
        ref={productModalRef}
        className="modal fade"
        tabIndex="-1"
        data-bs-backdrop="static"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className="modal-header bg-dark text-white">
              <h5 id="productModalLabel" className="modal-title">
                <span>{modalType === "create" ? "新增產品" : "編輯產品"}</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div>
                <div>
                  <div className="mb-3 row">
                    <div className="col-sm-2">
                      <label htmlFor="title" className="form-label">
                        標題
                      </label>
                    </div>
                    <div className="col-sm-10">
                      <input
                        name="title"
                        onChange={(e) => handleInputChange(e, "productForm")}
                        type="text"
                        className="form-control"
                        placeholder="請輸入標題"
                        value={tempProductData.title}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <div className="row">
                        <div className="col-sm-4">
                          <label htmlFor="category" className="form-label">
                            分類
                          </label>
                        </div>
                        <div className="col-sm-8">
                          <input
                            name="category"
                            onChange={(e) =>
                              handleInputChange(e, "productForm")
                            }
                            type="text"
                            className="form-control"
                            placeholder="請輸入分類"
                            value={tempProductData.category}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 col-md-6">
                      <div className="row">
                        <div className="col-sm-2">
                          <label htmlFor="unit" className="form-label">
                            單位
                          </label>
                        </div>
                        <div className="col-sm-10">
                          <input
                            name="unit"
                            onChange={(e) =>
                              handleInputChange(e, "productForm")
                            }
                            type="text"
                            className="form-control"
                            placeholder="請輸入單位"
                            value={tempProductData.unit}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mb-3 col-md-6"></div>
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <div className="row">
                        <div className="col-sm-4">
                          <label htmlFor="origin_price" className="form-label">
                            原價
                          </label>
                        </div>
                        <div className="col-sm-8">
                          <input
                            name="origin_price"
                            onChange={(e) =>
                              handleInputChange(e, "productForm")
                            }
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="請輸入原價"
                            value={tempProductData.origin_price}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mb-3 col-md-6">
                      <div className="row">
                        <div className="col-sm-2">
                          <label htmlFor="price" className="form-label">
                            售價
                          </label>
                        </div>
                        <div className="col-sm-10">
                          <input
                            name="price"
                            onChange={(e) =>
                              handleInputChange(e, "productForm")
                            }
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="請輸入售價"
                            value={tempProductData.price}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr />

                  <div className="mb-3">
                    <div className="row">
                      <div className="col-sm-2">
                        <label htmlFor="description" className="form-label">
                          產品描述
                        </label>
                      </div>
                      <div className="col-sm-10">
                        <textarea
                          name="description"
                          onChange={(e) => handleInputChange(e, "productForm")}
                          className="form-control"
                          placeholder="請輸入產品描述"
                          value={tempProductData.description}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="row">
                      <div className="col-sm-2">
                        <label htmlFor="content" className="form-label">
                          說明內容
                        </label>
                      </div>
                      <div className="col-sm-10">
                        <textarea
                          name="content"
                          onChange={(e) => handleInputChange(e, "productForm")}
                          className="form-control"
                          value={tempProductData.content}
                          placeholder="請輸入說明內容"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="row">
                      <div className="col-sm-2">
                        <label
                          className="form-check-label"
                          htmlFor="is_enabled"
                        >
                          是否啟用
                        </label>
                      </div>
                      <div className="col-sm-10 d-flex">
                        <div className="form-check form-check-inline">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="is_enabled"
                            id="is_enabled_1"
                            value="1"
                            onChange={(e) =>
                              handleInputChange(e, "productForm")
                            }
                            checked={tempProductData.is_enabled * 1 === 1}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="is_enabled_1"
                          >
                            啟用
                          </label>
                        </div>
                        <div className="form-check form-check-inline">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="is_enabled"
                            id="is_enabled_0"
                            value="0"
                            onChange={(e) =>
                              handleInputChange(e, "productForm")
                            }
                            checked={tempProductData.is_enabled * 1 !== 1}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="is_enabled_0"
                          >
                            不啟用
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-2">
                    <div className="mb-3">
                      <div className="row">
                        <div className="col-sm-2">
                          <label htmlFor="imageUrl" className="form-label">
                            圖片網址
                          </label>
                        </div>
                        <div className="col-sm-8">
                          <input
                            type="text"
                            ref={inputImageUrlRef}
                            defaultValue={""}
                            className="form-control"
                            placeholder="請輸入圖片連結"
                          />
                        </div>
                        <div className="col-sm-2">
                          <button
                            className="btn btn-outline-info btn-sm d-block w-100"
                            onClick={() => handleAddImage()}
                          >
                            新增圖片
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap">
                    {tempProductData.imageUrl && (
                      <div className="position-relative">
                        <div className="images-thumbnails">
                          <img
                            src={tempProductData.imageUrl}
                            className="mx-auto card-img-top"
                            alt={tempProductData.imageUrl}
                          />
                        </div>
                        <div className="position-absolute bottom-0 start-0 w-100">
                          <div className="d-flex justify-content-center p-1 bg-white p-2 bg-opacity-75">
                            <div className="flex-grow-1 m-1">主圖</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {tempProductData.imagesUrl.map((pic, index) => (
                      <div className="position-relative" key={`image_${index}`}>
                        <div className="images-thumbnails">
                          <img
                            src={pic}
                            className="mx-auto card-img-top"
                            alt={pic}
                          />
                        </div>
                        <div className="position-absolute bottom-0 start-0 w-100">
                          <div className="d-flex justify-content-center p-1 bg-white p-2 bg-opacity-75">
                            <div className="flex-grow-1 m-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-info w-100"
                                onClick={() => handleChangeMainImage(pic)}
                              >
                                主圖
                              </button>
                            </div>
                            <div className="flex-grow-1 m-1">
                              <button
                                className="btn btn-outline-danger btn-sm w-100"
                                onClick={() => handleRemoveImage(pic)}
                              >
                                刪除
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => closeProductModal()}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  updateProduct(tempProductData.id);
                }}
              >
                確認
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="delProductModal"
        data-bs-backdrop="static"
        ref={delProductModalRef}
        tabIndex="-1"
        aria-labelledby="delProductModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h1 className="modal-title fs-5" id="delProductModalLabel">
                刪除產品
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p className="fs-5 py-3">
                您確定要刪除
                <span className="text-danger">{tempProductData.title}</span>嗎？
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => closeDelProductModal()}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => deleteProduct(tempProductData.id)}
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        <div
          className="toast"
          role="alert"
          id="msgToast"
          aria-live="assertive"
          aria-atomic="true"
          ref={msgToastRef}
        >
          <div className="toast-header">
            <strong className="me-auto fs-5">系統提示</strong>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="toast"
              aria-label="Close"
            ></button>
          </div>
          <div className="toast-body bg-white">
            {showMessages.msgs.map((msg, index) => (
              <p
                key={index}
                className={`text-start ${
                  showMessages.type === "error" ? "text-danger" : "text-success"
                }`}
              >
                {msg}
              </p>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
