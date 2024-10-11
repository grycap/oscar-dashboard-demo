import { useMinio } from "@/contexts/Minio/MinioContext";
import { _Object, CommonPrefix } from "@aws-sdk/client-s3";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GenericTable from "@/components/Table"; // Importar GenericTable
import { AlertCircle, Folder, Trash } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import OscarColors from "@/styles";
import { motion, AnimatePresence } from "framer-motion";
import useSelectedBucket from "../../hooks/useSelectedBucket";
import { Button } from "@/components/ui/button";
import DeleteDialog from "@/components/DeleteDialog";

type BucketItem =
  | {
      Name: string;
      Type: "folder";
      Key: CommonPrefix;
    }
  | {
      Name: string;
      Type: "file";
      Key: _Object;
    };

export default function BucketContent() {
  const { name: bucketName, path } = useSelectedBucket();

  const { getBucketItems, buckets, uploadFile, deleteFile } = useMinio();

  const [items, setItems] = useState<BucketItem[]>([]);

  const [isDroppingFile, setIsDroppingFile] = useState(false);

  useEffect(() => {
    if (bucketName) {
      getBucketItems(bucketName, path).then(({ items, folders }) => {
        const combinedItems = [
          ...(folders?.map((folder) => {
            const path = folder.Prefix?.split("/");
            const name = path?.[path.length - 2] || "";
            const res: BucketItem = {
              Name: name,
              Type: "folder",
              Key: folder,
            };
            return res;
          }) || []),
          ...(items?.map((item) => {
            const res: BucketItem = {
              Name: item.Key?.split("/").pop() || "",
              Type: "file",
              Key: item,
            };
            return res;
          }) || []),
        ];
        setItems(combinedItems);
      });
    }
  }, [bucketName, getBucketItems, buckets, path]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDroppingFile(false); // Restablecer el estado al soltar
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(bucketName!, path, files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDroppingFile(true); // Cambiar el estado a true cuando se arrastra un archivo
  };

  const handleDragLeave = () => {
    setIsDroppingFile(false); // Restablecer el estado cuando el archivo ya no está sobre el div
  };

  const [itemsToDelete, setItemsToDelete] = useState<BucketItem[]>([]);

  return (
    <motion.div
      animate={{
        scale: isDroppingFile ? 0.99 : 1,
        outline: isDroppingFile ? "1px dashed " + OscarColors.Green3 : "none",
        borderRadius: isDroppingFile ? "6px" : "0px",
      }}
      transition={{
        duration: 0.2,
        type: "spring",
        bounce: 0,
        outline: {
          duration: 0,
        },
      }}
      style={{
        flexGrow: 1,
        flexBasis: 0,
        overflow: "hidden",
        display: "flex",
        position: "relative",
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <AnimatePresence>
        {isDroppingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "50%",
            }}
          >
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Drop files to upload</AlertTitle>
              <AlertDescription>
                Release the mouse button to upload the files to the selected
                bucket.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      <DeleteDialog
        isOpen={itemsToDelete.length > 0}
        onClose={() => setItemsToDelete([])}
        onDelete={() => {
          itemsToDelete.forEach((item) => {
            if (item.Type === "file") {
              deleteFile(bucketName!, item.Key.Key!);
            }
            if (item.Type === "folder") {
              deleteFile(bucketName!, item.Key!.Prefix!);
            }
          });
        }}
        itemNames={itemsToDelete.map((item) => item.Name)}
      />
      <GenericTable
        data={items}
        columns={[
          {
            header: "Nombre",
            accessor: (item) => {
              if (item.Type === "folder") {
                return (
                  <Link
                    to={`/ui/minio/${bucketName}/${
                      (item.Key as CommonPrefix).Prefix
                    }`}
                    replace
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Folder size="20px" /> {item.Name}
                  </Link>
                );
              }
              return item.Name;
            },
          },
        ]}
        idKey="Name"
        actions={[
          {
            button: (item) => {
              return (
                <Button
                  variant={"ghost"}
                  size="icon"
                  onClick={() => setItemsToDelete([...itemsToDelete, item])}
                >
                  <Trash color={OscarColors.Red} />
                </Button>
              );
            },
          },
        ]}
      />
    </motion.div>
  );
}
