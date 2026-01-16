import { useState } from "react";
import axios from "axios";
import "./assets/style.css";

const { VITE_BASE_URL, VITE_API_PATH } = import.meta.env;

function App() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [isLogin, setIsLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState(null);
  const [primaryImage, setPrimaryImage] = useState(null);
  const [loginErrMessage, setLoginErrMessage] = useState(null);

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const response = await axios.post(
        `${VITE_BASE_URL}/admin/signin`,
        formData
      );
      const { token, expired } = response.data;
      document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
      setIsLogin(response.data.success);
      setLoginErrMessage(!response.data.success ? response.data.message : null);
      getProducts(token);

      // console.log(response.data);
    } catch (error) {
      setIsLogin(false);
      setLoginErrMessage(error.response?.data);
      
      console.log(error.response);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((preData) => ({
      ...preData,
      [name]: value,
    }));
  };

  const checkLogin = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("hexToken="))
        ?.split("=")[1];

      const config = {
        headers: { Authorization: token },
      };

      const checkRes = await axios.post(
        `${VITE_BASE_URL}/api/user/check`,
        {},
        config
      );

      setIsLogin(checkRes.data.success);
      getProducts(token);
      setLoginErrMessage(!checkRes.data.success ? checkRes.data.message : null);

      console.log("Token 驗證結果：", checkRes.data);
    } catch (error) {
      setIsLogin(false);
      setLoginErrMessage(error.response?.data);
      
      console.error("Token 驗證失敗：", error.response?.data);
    }
  };

  const getProducts = async (token) => {
    try {
      const response = await axios.get(
        `${VITE_BASE_URL}/api/${VITE_API_PATH}/admin/products`,
        { headers: { Authorization: token } }
      );
      console.log(response);
      setProducts(response.data.products);
    } catch (error) {
      console.error(error.response?.data);
    }
  };

  return (
    <>
      {isLogin ? (
        <div>
          <div className="container">
            <button
              className="btn btn-danger mb-5"
              type="button"
              onClick={checkLogin}
            >
              確認是否登入
            </button>
            <div className="text-end mt-4">
              <button className="btn btn-primary">建立新的產品</button>
            </div>

            <div>
              <table className="table mt-4">
                <thead>
                  <tr>
                    <th width="120">分類</th>
                    <th>產品名稱</th>
                    <th width="120" className="text-end">
                      原價
                    </th>
                    <th width="120" className="text-end">
                      售價
                    </th>
                    <th width="120">是否啟用</th>
                    <th width="120">編輯</th>
                    <th width="120"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.category}</td>
                      <td>{product.title}</td>
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
                            className="btn btn-outline-primary btn-sm"
                          >
                            編輯
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          data-bs-toggle="modal"
                          data-bs-target="#exampleModal"
                          onClick={() => setTempProduct(product)}
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="modal fade"
              id="exampleModal"
              tabindex="-1"
              aria-labelledby="exampleModalLabel"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-xl">
                <div className="modal-content">
                  <div className="modal-header">
                    <h1 className="modal-title fs-5" id="exampleModalLabel">
                      {tempProduct
                        ? `產品細節-${tempProduct.title}`
                        : `請選擇一個商品查看`}
                    </h1>
                    <button
                      type="button"
                      class="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div>
                      {tempProduct ? (
                        <div className="card mb-3">
                          <img
                            src={
                              primaryImage ? primaryImage : tempProduct.imageUrl
                            }
                            className="card-img-top primary-image"
                            alt="主圖"
                          />
                          <div className="d-flex flex-wrap justify-content-center">
                            {tempProduct.imagesUrl.map((photo) => (
                              <div>
                                <img
                                  onClick={() => setPrimaryImage(photo)}
                                  src={photo}
                                  className="card-img-top images"
                                  alt="其他圖片"
                                />{" "}
                              </div>
                            ))}
                          </div>
                          <div className="card-body">
                            <h5 className="card-title">
                              {tempProduct.title}
                              <span className="badge bg-primary ms-2">
                                {tempProduct.category}
                              </span>
                            </h5>
                            <p className="card-text">
                              商品描述：{tempProduct.description}
                            </p>
                            <p className="card-text">
                              商品內容：{tempProduct.content}
                            </p>
                            <div className="d-flex justify-content-center">
                              <span className="card-text text-secondary">
                                <del>{tempProduct.origin_price}</del>
                              </span>
                              元 /{" "}
                              <span className="text-danger">
                                {" "}
                                {tempProduct.price}{" "}
                              </span>
                              元
                            </div>
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
          </div>
        </div>
      ) : (
        <div className="container login">
          <div className="row justify-content-center">
            <h1 className="h3 mb-3 font-weight-normal">請先登入</h1>
            <div className="col-8">
              <form id="form" className="form-signin" onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control"
                    name="username"
                    placeholder="name@example.com"
                    value={formData.username}
                    onChange={(e) => handleInputChange(e)}
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
                    value={formData.password}
                    onChange={(e) => handleInputChange(e)}
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

      <div
        id="productModal"
        className="modal fade"
        tabIndex="-1"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className="modal-header bg-dark text-white">
              <h5 id="productModalLabel" className="modal-title">
                <span>新增產品</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-sm-4">
                  <div className="mb-2">
                    <div className="mb-3">
                      <label htmlFor="imageUrl" className="form-label">
                        輸入圖片網址
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="請輸入圖片連結"
                      />
                    </div>
                    <img className="img-fluid" src="" alt="" />
                  </div>
                  <div>
                    <button className="btn btn-outline-primary btn-sm d-block w-100">
                      新增圖片
                    </button>
                  </div>
                  <div>
                    <button className="btn btn-outline-danger btn-sm d-block w-100">
                      刪除圖片
                    </button>
                  </div>
                </div>
                <div className="col-sm-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      標題
                    </label>
                    <input
                      id="title"
                      type="text"
                      className="form-control"
                      placeholder="請輸入標題"
                    />
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="category" className="form-label">
                        分類
                      </label>
                      <input
                        id="category"
                        type="text"
                        className="form-control"
                        placeholder="請輸入分類"
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="unit" className="form-label">
                        單位
                      </label>
                      <input
                        id="unit"
                        type="text"
                        className="form-control"
                        placeholder="請輸入單位"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="origin_price" className="form-label">
                        原價
                      </label>
                      <input
                        id="origin_price"
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="請輸入原價"
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="price" className="form-label">
                        售價
                      </label>
                      <input
                        id="price"
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="請輸入售價"
                      />
                    </div>
                  </div>
                  <hr />

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      產品描述
                    </label>
                    <textarea
                      id="description"
                      className="form-control"
                      placeholder="請輸入產品描述"
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">
                      說明內容
                    </label>
                    <textarea
                      id="content"
                      className="form-control"
                      placeholder="請輸入說明內容"
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        id="is_enabled"
                        className="form-check-input"
                        type="checkbox"
                      />
                      <label className="form-check-label" htmlFor="is_enabled">
                        是否啟用
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                data-bs-dismiss="modal"
              >
                取消
              </button>
              <button type="button" className="btn btn-primary">
                確認
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
