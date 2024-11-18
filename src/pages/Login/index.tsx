import DocumentTitle from "@/components/DocumentTitle";
import OscarColors, { ColorWithOpacity } from "@/styles";
import BigLogo from "@/assets/oscar-big.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import EgiSvg from "@/assets/egi.svg";
import { FormEvent, useEffect } from "react";
import { getInfoApi } from "@/api/info/getInfoApi";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { alert } from "@/lib/alert";

import env from "@/env";

function Login() {
  const navigate = useNavigate();
  const { authData, setAuthData } = useAuth();
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const endpoint = formData.get("endpoint") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const token = undefined;

    // Check if the endpoint is a valid URL
    if (!endpoint.match(/^(http|https):\/\/[^ "]+$/)) {
      alert.error("Invalid endpoint");
      return;
    }

    try {
      await getInfoApi({ endpoint, username, password, token });

      setAuthData({
        authenticated: true,
        user: username,
        password,
        endpoint,
      });
    } catch (error) {
      alert.error("Invalid credentials");
    }
  }

  async function handleLoginEGI(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    let endpoint = formData.get("endpoint") as string;
    // Check if the endpoint is a valid URL
    if (!endpoint.match(/^(http|https):\/\/[^ "]+$/)) {
      alert.error("Invalid endpoint");
      return;
    }
    try {
      endpoint = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
      localStorage.setItem("api", endpoint);
      localStorage.setItem("client_id", env.client_id);
      localStorage.setItem("provider_url", env.provider_url);
      localStorage.setItem("url_authorize", env.url_authorize);
      localStorage.setItem("url_user_info", env.url_user_info);
      localStorage.setItem("token_endpoint", env.token_endpoint);
      window.location.replace(env.redirect_uri);
    } catch (error) {
      alert.error("Invalid credentials");
    }
  }

  useEffect(() => {
    if (authData?.authenticated) {
      navigate("/");
    }
  }, [authData]);

  useEffect(() => {
    document.title = "OSCAR - Login";
  }, []);

  return (
    <>
      <DocumentTitle value="Login" />
      <main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: ColorWithOpacity(OscarColors.Green1, 0.75),
        }}
      >
        <div
          style={{
            position: "relative",
            paddingBottom: "100px",
          }}
        >
          <div
            style={{
              position: "absolute",
              background: "#FFFFFF50",
              border: `1px solid ${OscarColors.Green1}`,
              width: "100%",
              height: "100px",
              bottom: 50,
              borderRadius: "0 0 30px 30px",
              zIndex: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                height: "50px",
              }}
            ></div>
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "10px",
                color: "rgba(0,0,0,0.5)",
                padding: "0 20px",
              }}
            >
              <div>
                <a href="https://oscar.grycap.net">
                  Provided by GRyCAP-I3M-UPV
                </a>
              </div>
              <div>Universitat Politècnica de València, Spain.</div>
            </div>
          </div>
          <section
            style={{
              zIndex: 2,
              borderRadius: "30px",
              display: "flex",
              flexDirection: "column",
              background: "white",
              alignItems: "center",
              padding: "36px 48px",
              gap: "26px",
              border: `1px solid ${OscarColors.Green1}`,
              position: "relative",
            }}
          >
            <img src={BigLogo} alt="Oscar logo" width={320} />
            <form
              onSubmit={(e) => {
                const buttonExecuter = (e.nativeEvent as SubmitEvent).submitter;
                if (buttonExecuter != null) {
                  const buttonName = buttonExecuter.getAttribute("name");
                  if (buttonName === "normal") handleLogin(e);
                  if (buttonName === "EGI") handleLoginEGI(e);
                }
              }}
              style={{
                width: "320px",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <Input name="endpoint" placeholder="Endpoint" required />
              <Separator />
              <Input
                name="username"
                type="text"
                placeholder="Username"
              />
              <Input
                name="password"
                type="password"
                placeholder="Password"
              />

              <Button
                name="normal"
                type="submit"
                size={"sm"}
                style={{
                  background: OscarColors.Green4,
                }}
              >
                Sign in
              </Button>
              <Separator />
              <Button
                name="EGI"
                type="submit"
                size="sm"
                style={{
                  width: "100%",
                  background: OscarColors.Blue,
                }}
              >
                <img
                  src={EgiSvg}
                  alt="EGI Check-in"
                  style={{
                    width: "24px",
                    marginRight: "10px",
                  }}
                />
                Login via EGI Check-in
              </Button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

export default Login;
