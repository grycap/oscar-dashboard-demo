import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useServicesContext from "../../context/ServicesContext";
import {
  Dialog,
  DialogDescription,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Input } from "@/components/ui/input";
import YAML from "yaml";
import { Service } from "../../models/service";
import createServiceApi from "@/api/services/createServiceApi";
import { alert } from "@/lib/alert";
import RequestButton from "@/components/RequestButton";

function FDLForm() {
  const { showFDLModal, setShowFDLModal, refreshServices } =
    useServicesContext();
  const [selectedTab, setSelectedTab] = useState<"fdl" | "script">("fdl");
  const [editorKey, setEditorKey] = useState(0);

  const [fdl, setFdl] = useState("");
  const [script, setScript] = useState("");

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setFdl(e.target?.result as string);
    };
    reader.readAsText(file);
  }

  const prepareServices = () => {
    const obj = YAML.parse(fdl);
    const services: Service[] = [];
    const scriptContent = script;
    if (obj.functions && obj.functions.oscar) {
      obj.functions.oscar.forEach((service: Record<string, Service>) => {
        console.log(service);
        const serviceKey = Object.keys(service)[0];
        const serviceParams = service[serviceKey];
        serviceParams.script = scriptContent;
        serviceParams.storage_providers = obj.storage_providers || {};
        serviceParams.clusters = obj.clusters || {};
        services.push(serviceParams);
      });
    }

    return services;
  };

  async function handleSave() {
    if (!fdl) {
      alert.error("Please fill the FDL file");
      return;
    }

    if (!script) {
      alert.error("Please fill the script");
      return;
    }

    const services = prepareServices();

    const promises = services.map(async (service) => {
      const response = await createServiceApi(service);
      return response;
    });

    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        alert.error(
          `Error creating service ${services[index].name}: ${result.reason}`
        );
      } else {
        alert.success(`Service ${services[index].name} created successfully`);
      }
    });

    if (results.every((result) => result.status === "fulfilled")) {
      setShowFDLModal(false);
      setFdl("");
      setScript("");
      setSelectedTab("fdl");
      refreshServices();
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setEditorKey((prevKey) => prevKey + 1);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!showFDLModal) {
      setFdl("");
      setScript("");
      setSelectedTab("fdl");
    }
  }, [showFDLModal]);

  return (
    <Dialog open={showFDLModal} onOpenChange={setShowFDLModal}>
      {/* <DialogTrigger>Open</DialogTrigger> */}
      <DialogContent style={{ maxWidth: "80vw", width: "80vw" }}>
        <DialogHeader>
          <DialogTitle>Create the service using FDL</DialogTitle>
          <DialogDescription>
            Use the code editor to edit the FDL file and the script.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          defaultValue="account"
          value={selectedTab}
          onValueChange={(value) => {
            setSelectedTab(value as "fdl" | "script");
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
            <TabsList>
              <TabsTrigger style={{ padding: "7px 30px" }} value="fdl">
                FDL
              </TabsTrigger>
              <TabsTrigger style={{ padding: "7px 30px" }} value="script">
                Script
              </TabsTrigger>
            </TabsList>

            <Input key={selectedTab} type="file" onChange={handleFileUpload} />
          </div>
          <TabsContent value="fdl" style={{ outline: "none", width: "100%" }}>
            <Editor
              key={`fdl-${editorKey}`}
              language="yaml"
              value={fdl}
              onChange={(e) => {
                setFdl(e || "");
              }}
              width="100%"
              height="60vh"
              options={{
                minimap: {
                  enabled: false,
                },
              }}
            />
          </TabsContent>
          <TabsContent
            value="script"
            style={{ outline: "none", width: "100%" }}
          >
            <Editor
              key={`script-${editorKey}`}
              language="javascript"
              defaultValue={script}
              onChange={(e) => {
                setScript(e || "");
              }}
              width="100%"
              height="60vh"
              options={{
                minimap: {
                  enabled: false,
                },
              }}
            />
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <RequestButton request={handleSave}>Save</RequestButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FDLForm;
