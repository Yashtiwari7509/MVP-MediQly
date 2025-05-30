import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Logo from "@/components/Logo";
import { useDocRegister } from "@/hooks/auth";

const formSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  firstName: z
    .string()
    .min(3, "First name must be at least 3 characters")
    .max(20, "First name must not exceed 20 characters"),
  lastName: z
    .string()
    .min(3, "Last name must be at least 3 characters")
    .max(20, "Last name must not exceed 20 characters"),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  specialization: z.enum([
    "Cardiologist",
    "Neurologist",
    "Pediatrician",
    "Dermatologist",
    "Orthopedist",
    "Psychiatrist",
    "General Practitioner",
    "Other",
  ]),
  experience: z.coerce.number().min(0, "Experience must be a positive number"),
  qualifications: z.array(
    z.string().min(2, "Qualification must be at least 2 characters long")
  ),
});
const DocRegister = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [qualifications, setQualifications] = useState([""]);

  const specializations = [
    "Cardiologist",
    "Neurologist",
    "Pediatrician",
    "Dermatologist",
    "Orthopedist",
    "Psychiatrist",
    "General Practitioner",
    "Other",
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      specialization: undefined,
      experience: 0,
      qualifications: [""],
    },
  });

  const docRegister = useDocRegister();
  const addQualification = () => {
    setQualifications([...qualifications, ""]);
  };

  const removeQualification = (index: any) => {
    const newQualifications = qualifications.filter((_, i) => i !== index);
    setQualifications(newQualifications);
  };
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    docRegister.mutate(values as any, {
      onSuccess: () => {
        toast.success(
          "Doctor account created successfully. Redirecting to login..."
        );
        navigate("/");
      },
      onError: (error) => {
        console.log(error);
        toast.error(
          (error as any).response?.data[0]?.message ||
            (error as any).response?.data?.message ||
            "Registration failed"
        );
      },
    });
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="auth-Image relative hidden h-full flex-col bg-cover bg-center bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0" />
        <Logo />
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Join our platform to connect with patients and provide
              exceptional healthcare services."
            </p>
            <footer className="text-sm">Doctor Portal</footer>
          </blockquote>
        </div>
      </div>

      <div className="p-4 lg:p-8 h-full flex items-center overflow-y-auto">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create Doctor Account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your information to join our medical platform
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Basic Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          {...field}
                          autoComplete="current-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            {...field}
                            autoComplete="current-password"
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">
                  Professional Information
                </h2>

                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select specialization" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {specializations.map((spec) => (
                            <SelectItem key={spec} value={spec}>
                              {spec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Qualifications</FormLabel>
                  {qualifications.map((_, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <FormField
                        control={form.control}
                        name={`qualifications.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                placeholder="e.g., MBBS, MD"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeQualification(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={addQualification}
                  >
                    Add Qualification
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={docRegister.isPending}
              >
                {docRegister.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" />
                    Creating account...
                  </div>
                ) : (
                  "Create Doctor Account"
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocRegister;
