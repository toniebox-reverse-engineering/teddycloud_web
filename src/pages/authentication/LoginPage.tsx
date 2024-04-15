import { useTranslation } from "react-i18next";
import {
    StyledContent,
    StyledLayout,
} from "../../components/StyledComponents";
import {InputField} from "../../components/form/InputField";
import {ErrorMessage,  Form, Formik, } from "formik";
import { useAuth } from "../../provider/AuthProvider";
import { useNavigate} from "react-router-dom";

export const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate()
    const {t} = useTranslation();
    const initialValues = {
        username: '',
        password: ''
    };
    
    const handleSubmit = async (values: { username: string; password: string }) => {
        try {
            console.log("Calling login")
            await login(values.username, values.password);
            console.log("Calling Done")
            navigate("/")
            // Redirect or show success message after successful login
        } catch (error) {
            // Handle login error (e.g., display error message)
            console.error('Login error:', error);
        }
    };

    return (
        <>
            <StyledLayout>
                <StyledContent>
                    <h1>{t(`home.title`)}</h1>
                <Formik
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                    >
                    {({ isSubmitting }) => (
                        <Form>
                            <InputField type="username" name="username" />
                            <ErrorMessage name="username" component="div" />
                            <InputField type="password" name="password" />
                            <ErrorMessage name="password" component="div" />
                            <button type="submit" disabled={isSubmitting}>
                                Submit
                            </button>
                        </Form>
                        )}
                </Formik>
                </StyledContent>
        </StyledLayout>
        </>
        );
};
